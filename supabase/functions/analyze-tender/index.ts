import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const toBase64 = (bytes: Uint8Array) => {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const { reportId } = await req.json();
    if (!reportId) throw new Error("reportId is required");

    // Get report with tender info
    const { data: report, error: reportError } = await supabase
      .from("analysis_reports")
      .select("*, tenders(title, contracting_entity, contract_amount, duration, submission_deadline, sector, garantia_provisional, garantia_definitiva, clasificacion_requerida, valor_estimado)")
      .eq("id", reportId)
      .single();
    if (reportError || !report) throw new Error("Report not found");

    // Get company data for matching (CAPA 3)
    const { data: company } = await supabase
      .from("companies")
      .select("*")
      .eq("id", report.company_id)
      .single();

    const { data: companyCerts } = await supabase
      .from("company_certifications")
      .select("*")
      .eq("company_id", report.company_id);

    const { data: companyExp } = await supabase
      .from("company_experience")
      .select("*")
      .eq("company_id", report.company_id);

    const { data: companyTeam } = await supabase
      .from("company_team")
      .select("*")
      .eq("company_id", report.company_id);

    // Get uploaded documents
    const { data: docs } = await supabase
      .from("tender_documents")
      .select("file_name, file_path, file_size, mime_type")
      .eq("tender_id", report.tender_id);

    // Download PDF content
    let pdfTexts: string[] = [];
    if (docs && docs.length > 0) {
      for (const doc of docs) {
        const { data: fileData } = await supabase.storage.from("tender-documents").download(doc.file_path);
        if (fileData) {
          const bytes = await fileData.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
          pdfTexts.push(base64);
        }
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const tenderInfo = report.tenders as any;

    // Build company context for CAPA 3
    const companyContext = company ? `
DATOS DE LA EMPRESA LICITADORA:
- Razón Social: ${company.name}
- CIF: ${company.cif || 'No proporcionado'}
- Facturación Anual: ${company.facturacion_anual ? company.facturacion_anual + '€' : 'No proporcionada'}
- Patrimonio Neto: ${company.patrimonio_neto ? company.patrimonio_neto + '€' : 'No proporcionado'}
- Clasificación Empresarial: ${company.clasificacion_empresarial || 'No proporcionada'}
- Sectores de Actividad: ${company.sectores_actividad?.join(', ') || 'No especificados'}
- Capacidad Técnica: ${company.capacidad_tecnica || 'No proporcionada'}
- Capacidad Económica: ${company.capacidad_economica || 'No proporcionada'}

CERTIFICACIONES:
${companyCerts?.map(c => `- ${c.nombre} (${c.organismo_emisor || 'N/A'}) - Vigente hasta: ${c.fecha_vencimiento || 'N/A'}`).join('\n') || 'Sin certificaciones registradas'}

EXPERIENCIA PREVIA:
${companyExp?.map(e => `- ${e.titulo} | Cliente: ${e.cliente || 'N/A'} | Sector: ${e.sector || 'N/A'} | Importe: ${e.importe ? e.importe + '€' : 'N/A'}`).join('\n') || 'Sin experiencia registrada'}

EQUIPO TÉCNICO:
${companyTeam?.map(t => `- ${t.nombre} | ${t.cargo || 'N/A'} | ${t.titulacion || 'N/A'} | ${t.experiencia_anos || 0} años | Especialidad: ${t.sector_especialidad || 'N/A'}`).join('\n') || 'Sin equipo registrado'}
` : 'No se proporcionaron datos de empresa.';

    const systemPrompt = `Eres el motor estratégico de PLIEGO SMART. Actúas como un comité evaluador + asesor jurídico + director técnico + analista financiero + estratega competitivo.

No simplificas. No omites. No especulas. No inventas.

ARQUITECTURA DE ANÁLISIS EN 4 CAPAS:

CAPA 1 – EXTRACCIÓN ESTRUCTURADA: Identifica secciones, clasifica cláusulas, detecta fechas críticas, identifica anexos obligatorios.
CAPA 2 – CLASIFICACIÓN SECTORIAL: Detecta automáticamente el sector (Obras Civiles, Energía, Agua, Tecnología, Sanidad, Servicios, Industrial, Transporte, Telecomunicaciones, Ambiental, Arquitectura, Facility Management) y activa lógica sectorial específica.
CAPA 3 – CRUCE CON EMPRESA: Matching de experiencia, facturación, equipo técnico, certificaciones. Identifica fortalezas y brechas.
CAPA 4 – MOTOR DE ESTRATEGIA COMPETITIVA: Optimización de criterios automáticos y subjetivos, estrategia económica, narrativa técnica, mejoras diferenciales.

MODELO DE SCORING:
- IAT (Índice de Adecuación Técnica): (Experiencia similar ponderada + Equipo técnico ponderado + Medios técnicos ponderados) / Total exigido. Escala 0-100.
  * >85 = Alta competitividad | 65-85 = Media | <65 = Riesgo alto
- IRE (Índice de Riesgo de Exclusión): 0 = sin riesgo, 100 = exclusión segura. Se activa si faltan requisitos formales, clasificación insuficiente, garantías mal calculadas, solvencia insuficiente.
- PEA (Probabilidad Estimada de Adjudicación): f(IAT + Puntuación Económica Estimada + Peso Juicio Valor + Competitividad Sectorial). Escala 0-100.

Usa tool calling para devolver el resultado estructurado.`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    const tenderText = `Analiza el siguiente pliego de licitación.
Título: "${tenderInfo?.title || 'Sin título'}"
Entidad contratante: "${tenderInfo?.contracting_entity || 'No especificada'}"
Importe: ${tenderInfo?.contract_amount || 'No especificado'}€
Valor estimado: ${tenderInfo?.valor_estimado || 'No especificado'}€
Duración: ${tenderInfo?.duration || 'No especificada'}
Plazo presentación: ${tenderInfo?.submission_deadline || 'No especificado'}
Garantía provisional: ${tenderInfo?.garantia_provisional || 'No especificada'}€
Garantía definitiva: ${tenderInfo?.garantia_definitiva || 'No especificada'}€
Clasificación requerida: ${tenderInfo?.clasificacion_requerida || 'No especificada'}
Documentos adjuntos: ${docs?.map(d => d.file_name).join(', ') || 'Ninguno'}

${companyContext}`;

    if (pdfTexts.length > 0) {
      const userContent: any[] = [{ type: "text", text: tenderText }];
      for (let i = 0; i < pdfTexts.length; i++) {
        userContent.push({
          type: "file",
          file: { filename: docs![i].file_name, file_data: `data:application/pdf;base64,${pdfTexts[i]}` },
        });
      }
      messages.push({ role: "user", content: userContent });
    } else {
      messages.push({ role: "user", content: tenderText });
    }

    const tools = [{
      type: "function",
      function: {
        name: "generar_informe_pliego",
        description: "Genera el informe completo de análisis del pliego con las 12 secciones obligatorias y scoring.",
        parameters: {
          type: "object",
          properties: {
            sector_detectado: { type: "string", description: "Sector industrial detectado" },
            resumen_ejecutivo: { type: "string", description: "Resumen ejecutivo estratégico (3-5 frases)" },
            datos_contractuales: {
              type: "object",
              properties: {
                objeto_contrato: { type: "string" }, entidad_contratante: { type: "string" },
                presupuesto_base: { type: "string" }, valor_estimado: { type: "string" },
                duracion: { type: "string" }, plazo_presentacion: { type: "string" },
                tipo_contrato: { type: "string" }, procedimiento: { type: "string" },
                garantia_provisional: { type: "string" }, garantia_definitiva: { type: "string" },
                clasificacion_requerida: { type: "string" },
              },
              required: ["objeto_contrato"],
              additionalProperties: false,
            },
            requisitos_administrativos: {
              type: "array", items: {
                type: "object",
                properties: { descripcion: { type: "string" }, obligatorio: { type: "boolean" }, normativa: { type: "string" }, riesgo_exclusion: { type: "string", enum: ["alto", "medio", "bajo"] } },
                required: ["descripcion"], additionalProperties: false,
              }
            },
            requisitos_tecnicos: {
              type: "array", items: {
                type: "object",
                properties: { descripcion: { type: "string" }, experiencia_minima: { type: "string" }, equipo_minimo: { type: "string" }, medios_minimos: { type: "string" } },
                required: ["descripcion"], additionalProperties: false,
              }
            },
            solvencia: {
              type: "object",
              properties: { economica: { type: "array", items: { type: "string" } }, tecnica: { type: "array", items: { type: "string" } }, profesional: { type: "array", items: { type: "string" } } },
              additionalProperties: false,
            },
            criterios_adjudicacion: {
              type: "array", items: {
                type: "object",
                properties: { criterio: { type: "string" }, tipo: { type: "string", enum: ["automatico", "juicio_valor"] }, ponderacion: { type: "number" }, formula: { type: "string" } },
                required: ["criterio", "tipo", "ponderacion"], additionalProperties: false,
              }
            },
            analisis_sectorial: { type: "string", description: "Análisis específico del sector detectado con lógica diferenciada" },
            comparativa_empresa: {
              type: "object",
              properties: {
                cumplimiento: { type: "string", enum: ["total", "parcial", "no_cumple"] },
                fortalezas: { type: "array", items: { type: "string" } },
                brechas: { type: "array", items: { type: "string" } },
                observaciones: { type: "string" },
                acciones_recomendadas: { type: "string" },
              },
              additionalProperties: false,
            },
            riesgos: {
              type: "array", items: {
                type: "object",
                properties: { tipo: { type: "string", enum: ["juridico", "tecnico", "economico"] }, descripcion: { type: "string" }, nivel: { type: "string", enum: ["alto", "medio", "bajo"] }, mitigacion: { type: "string" } },
                required: ["tipo", "descripcion", "nivel"], additionalProperties: false,
              }
            },
            estrategia: {
              type: "object",
              properties: { economica: { type: "string" }, tecnica: { type: "string" }, mejoras_propuestas: { type: "string" }, narrativa_recomendada: { type: "string" } },
              additionalProperties: false,
            },
            checklist_documental: { type: "array", items: { type: "string" } },
            recomendaciones_presentacion: { type: "array", items: { type: "string" } },
            scoring: {
              type: "object",
              properties: {
                iat: { type: "number", description: "Índice de Adecuación Técnica 0-100" },
                ire: { type: "number", description: "Índice de Riesgo de Exclusión 0-100" },
                pea: { type: "number", description: "Probabilidad Estimada de Adjudicación 0-100" },
                iat_detalle: { type: "string" },
                ire_detalle: { type: "string" },
                pea_detalle: { type: "string" },
                recomendacion_presentarse: { type: "string", enum: ["alta", "media", "baja", "no_recomendable"] },
              },
              required: ["iat", "ire", "pea", "recomendacion_presentarse"],
              additionalProperties: false,
            },
          },
          required: ["sector_detectado", "resumen_ejecutivo", "datos_contractuales", "criterios_adjudicacion", "riesgos", "scoring"],
          additionalProperties: false,
        },
      },
    }];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools,
        tool_choice: { type: "function", function: { name: "generar_informe_pliego" } },
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        await supabase.from("analysis_reports").update({ status: "error", report_data: { error: "Rate limit exceeded" } }).eq("id", reportId);
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido. Inténtalo de nuevo en unos minutos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (status === 402) {
        await supabase.from("analysis_reports").update({ status: "error", report_data: { error: "Payment required" } }).eq("id", reportId);
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", status, errText);
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    
    // Extract structured data from tool call
    let reportData: any;
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        reportData = JSON.parse(toolCall.function.arguments);
      } else {
        // Fallback to content parsing
        const content = aiData.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
        reportData = JSON.parse(jsonMatch[1].trim());
      }
    } catch {
      reportData = { raw_analysis: aiData.choices?.[0]?.message?.content || "Error parsing", parse_error: true };
    }

    // Store structured data in sub-tables
    const tenderId = report.tender_id;
    
    // Update tender sector
    if (reportData.sector_detectado) {
      await supabase.from("tenders").update({ sector: reportData.sector_detectado }).eq("id", tenderId);
    }

    // Save admin requirements
    if (reportData.requisitos_administrativos?.length) {
      await supabase.from("tender_requirements_admin").insert(
        reportData.requisitos_administrativos.map((r: any) => ({
          tender_id: tenderId, descripcion: r.descripcion, obligatorio: r.obligatorio ?? true,
          normativa_aplicable: r.normativa, riesgo_exclusion: r.riesgo_exclusion || 'medio',
        }))
      );
    }

    // Save tech requirements
    if (reportData.requisitos_tecnicos?.length) {
      await supabase.from("tender_requirements_tech").insert(
        reportData.requisitos_tecnicos.map((r: any) => ({
          tender_id: tenderId, descripcion: r.descripcion,
          experiencia_minima: r.experiencia_minima, equipo_minimo: r.equipo_minimo, medios_minimos: r.medios_minimos,
        }))
      );
    }

    // Save criteria
    if (reportData.criterios_adjudicacion?.length) {
      await supabase.from("tender_criteria").insert(
        reportData.criterios_adjudicacion.map((c: any) => ({
          tender_id: tenderId, tipo: c.tipo, descripcion: c.criterio,
          ponderacion: c.ponderacion, formula: c.formula,
        }))
      );
    }

    // Save risks
    if (reportData.riesgos?.length) {
      await supabase.from("tender_risks").insert(
        reportData.riesgos.map((r: any) => ({
          tender_id: tenderId, tipo: r.tipo, descripcion: r.descripcion,
          nivel: r.nivel, mitigacion: r.mitigacion,
        }))
      );
    }

    // Save strategy
    if (reportData.estrategia) {
      await supabase.from("tender_strategy").insert({
        tender_id: tenderId,
        estrategia_economica: reportData.estrategia.economica,
        estrategia_tecnica: reportData.estrategia.tecnica,
        mejoras_propuestas: reportData.estrategia.mejoras_propuestas,
        narrativa_recomendada: reportData.estrategia.narrativa_recomendada,
      });
    }

    // Save matching
    if (reportData.comparativa_empresa && company) {
      await supabase.from("tender_matching").insert({
        tender_id: tenderId, company_id: report.company_id,
        cumplimiento: reportData.comparativa_empresa.cumplimiento,
        iat_score: reportData.scoring?.iat || 0,
        ire_score: reportData.scoring?.ire || 0,
        pea_score: reportData.scoring?.pea || 0,
        riesgo: reportData.scoring?.recomendacion_presentarse,
        observaciones: reportData.comparativa_empresa.observaciones,
        acciones_recomendadas: reportData.comparativa_empresa.acciones_recomendadas,
        fortalezas: reportData.comparativa_empresa.fortalezas || [],
        brechas: reportData.comparativa_empresa.brechas || [],
      });
    }

    // Update report
    await supabase.from("analysis_reports")
      .update({ status: "completed", report_data: reportData, updated_at: new Date().toISOString() })
      .eq("id", reportId);

    return new Response(JSON.stringify({ success: true, report_data: reportData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-tender error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
