import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Buffer } from "node:buffer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Limits tuned for integral multi-document analysis
const MAX_DOCS_FOR_AI = 10;
const MAX_FILE_SIZE_BYTES = 60_000_000; // 60MB per file
const MAX_TOTAL_PAYLOAD_BYTES = 120_000_000; // 120MB total for all docs
const MAX_COMPANY_ITEMS = 20;

const toBase64 = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64");

const safeList = (items: unknown[] | null | undefined, max = MAX_COMPANY_ITEMS) => (items ?? []).slice(0, max);

const getMimeForAI = (fileName: string, originalMime: string | null): string => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (lower.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  return originalMime || "application/octet-stream";
};

const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".xlsx"];

const isSupportedDoc = (fileName: string): boolean => {
  const lower = fileName.toLowerCase();
  return SUPPORTED_EXTENSIONS.some(ext => lower.endsWith(ext));
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let reportId: string | null = null;
  let tenderIdForStatus: string | null = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

    if (!supabaseUrl || !supabaseKey || !anonKey) {
      throw new Error("Missing backend environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const anonClient = createClient(supabaseUrl, anonKey);

    const token = authHeader.replace("Bearer ", "").trim();
    const { data: claimsData, error: authError } = await anonClient.auth.getClaims(token);
    const userId = claimsData?.claims?.sub;
    if (authError || !userId) throw new Error("Unauthorized");

    const payload = await req.json();
    reportId = payload?.reportId ?? null;
    if (!reportId) throw new Error("reportId is required");

    // Get report with tender info
    const { data: report, error: reportError } = await supabase
      .from("analysis_reports")
      .select("*, tenders(title, contracting_entity, contract_amount, duration, submission_deadline, sector, garantia_provisional, garantia_definitiva, clasificacion_requerida, valor_estimado)")
      .eq("id", reportId)
      .single();
    if (reportError || !report) throw new Error("Report not found");

    tenderIdForStatus = report.tender_id;
    await supabase.from("tenders").update({ status: "processing" }).eq("id", tenderIdForStatus);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const extractDocumentSummary = async (docName: string, mime: string, bytes: Uint8Array) => {
      const base64 = toBase64(bytes);
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content:
                "Eres un extractor documental experto en pliegos. Devuelve síntesis estricta, concreta y acotada en tamaño.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analiza exhaustivamente el documento \"${docName}\" y devuelve una síntesis estructurada en español con estas secciones: 1) Datos contractuales, 2) Requisitos administrativos, 3) Requisitos técnicos, 4) Criterios de adjudicación y ponderaciones, 5) Solvencia, 6) Riesgos y penalidades, 7) Subcontratación, revisión de precios y garantías, 8) Fechas críticas y anexos obligatorios.\n\nReglas: cita documento y cláusula/sección cuando sea posible; no inventes datos; incluye contradicciones internas si existen; máximo 9000 caracteres en total.`,
                },
                {
                  type: "file",
                  file: { filename: docName, file_data: `data:${mime};base64,${base64}` },
                },
              ],
            },
          ],
          max_tokens: 2200,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Error extracción ${docName}: ${response.status} ${txt.slice(0, 200)}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error(`Respuesta vacía al extraer ${docName}`);
      }

      return content.slice(0, 12000);
    };

    // Get company data for matching (CAPA 3)
    const [
      { data: company },
      { data: companyCerts },
      { data: companyExp },
      { data: companyTeam },
      { data: companyEquipment },
      { data: docs },
    ] = await Promise.all([
      supabase.from("companies").select("*").eq("id", report.company_id).single(),
      supabase.from("company_certifications").select("*").eq("company_id", report.company_id),
      supabase.from("company_experience").select("*").eq("company_id", report.company_id),
      supabase.from("company_team").select("*").eq("company_id", report.company_id),
      supabase.from("company_equipment").select("*").eq("company_id", report.company_id),
      supabase.from("tender_documents").select("file_name, file_path, file_size, mime_type, created_at").eq("tender_id", report.tender_id).order("created_at", { ascending: true }),
    ]);

    const supportedDocs = (docs ?? [])
      .filter((doc) => isSupportedDoc(doc.file_name))
      .sort((a: any, b: any) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

    const docsForAi = supportedDocs.slice(0, MAX_DOCS_FOR_AI);
    const skippedDocs: string[] = [];
    const attachedDocs: { file_name: string; base64: string; mime: string }[] = [];
    const documentSummaries: string[] = [];
    let totalPayloadSize = 0;

    const estimatedTotalBytes = docsForAi.reduce((acc, doc: any) => acc + (doc.file_size || 0), 0);
    const useStagedDocAnalysis = estimatedTotalBytes > 30_000_000 || docsForAi.some((doc: any) => (doc.file_size || 0) > 20_000_000);

    for (const doc of docsForAi) {
      if (doc.file_size && doc.file_size > MAX_FILE_SIZE_BYTES) {
        skippedDocs.push(`${doc.file_name} (omitido: tamaño > ${Math.round(MAX_FILE_SIZE_BYTES / 1_000_000)}MB)`);
        continue;
      }

      if (!useStagedDocAnalysis && totalPayloadSize + (doc.file_size || 0) > MAX_TOTAL_PAYLOAD_BYTES) {
        skippedDocs.push(`${doc.file_name} (omitido: se superaría el límite total de ${Math.round(MAX_TOTAL_PAYLOAD_BYTES / 1_000_000)}MB)`);
        continue;
      }

      const { data: fileData, error: downloadError } = await supabase.storage.from("tender-documents").download(doc.file_path);
      if (downloadError || !fileData) {
        skippedDocs.push(`${doc.file_name} (no se pudo descargar)`);
        continue;
      }

      const bytes = new Uint8Array(await fileData.arrayBuffer());
      if (bytes.length > MAX_FILE_SIZE_BYTES) {
        skippedDocs.push(`${doc.file_name} (omitido: tamaño real > ${Math.round(MAX_FILE_SIZE_BYTES / 1_000_000)}MB)`);
        continue;
      }

      const mime = getMimeForAI(doc.file_name, doc.mime_type);
      const base64 = toBase64(bytes);

      if (useStagedDocAnalysis) {
        console.log(`Extracting document in staged mode: ${doc.file_name} (${Math.round(bytes.length / 1024)}KB)`);
        try {
          const summary = await extractDocumentSummary(doc.file_name, mime, base64);
          documentSummaries.push(`DOCUMENTO: ${doc.file_name}\n${summary}`);
          totalPayloadSize += bytes.length;
        } catch (extractError: any) {
          skippedDocs.push(`${doc.file_name} (error de extracción: ${extractError?.message || "desconocido"})`);
        }
      } else {
        totalPayloadSize += bytes.length;
        attachedDocs.push({ file_name: doc.file_name, base64, mime });
      }
    }

    if (supportedDocs.length > MAX_DOCS_FOR_AI) {
      skippedDocs.push(`${supportedDocs.length - MAX_DOCS_FOR_AI} documento(s) extra no procesado(s) (máx ${MAX_DOCS_FOR_AI})`);
    }

    const tenderInfo = report.tenders as any;

    // Build comprehensive company context for CAPA 3
    const companyContext = company ? `
═══════════════════════════════════════════════════════
DATOS DE LA EMPRESA LICITADORA (para CAPA 3 - Matching)
═══════════════════════════════════════════════════════
- Razón Social: ${company.name}
- CIF: ${company.cif || 'No proporcionado'}
- Facturación Anual: ${company.facturacion_anual ? company.facturacion_anual.toLocaleString() + '€' : 'No proporcionada'}
- Patrimonio Neto: ${company.patrimonio_neto ? company.patrimonio_neto.toLocaleString() + '€' : 'No proporcionado'}
- Clasificación Empresarial: ${company.clasificacion_empresarial || 'No proporcionada'}
- Sectores de Actividad: ${company.sectores_actividad?.join(', ') || 'No especificados'}
- Capacidad Técnica: ${company.capacidad_tecnica || 'No proporcionada'}
- Capacidad Económica: ${company.capacidad_economica || 'No proporcionada'}
- Dirección: ${company.address || 'No proporcionada'}
- Web: ${company.website || 'No proporcionada'}

CERTIFICACIONES DE LA EMPRESA:
${safeList(companyCerts)?.map((c: any) => `  • ${c.nombre} | Emisor: ${c.organismo_emisor || 'N/A'} | Vigente hasta: ${c.fecha_vencimiento || 'N/A'} | Puntuable: ${c.puntuable ? 'Sí' : 'No'}`).join('\n') || '  Sin certificaciones registradas'}

EXPERIENCIA PREVIA DE LA EMPRESA:
${safeList(companyExp)?.map((e: any) => `  • ${e.titulo} | Cliente: ${e.cliente || 'N/A'} | Sector: ${e.sector || 'N/A'} | Importe: ${e.importe ? e.importe.toLocaleString() + '€' : 'N/A'} | Desde: ${e.fecha_inicio || 'N/A'} hasta: ${e.fecha_fin || 'N/A'} | Resultado: ${e.resultado || 'N/A'}`).join('\n') || '  Sin experiencia registrada'}

EQUIPO TÉCNICO DE LA EMPRESA:
${safeList(companyTeam)?.map((t: any) => `  • ${t.nombre} | Cargo: ${t.cargo || 'N/A'} | Titulación: ${t.titulacion || 'N/A'} | Experiencia: ${t.experiencia_anos || 0} años | Especialidad: ${t.sector_especialidad || 'N/A'} | Certificaciones: ${t.certificaciones?.join(', ') || 'N/A'}`).join('\n') || '  Sin equipo registrado'}

EQUIPAMIENTO Y MEDIOS MATERIALES DE LA EMPRESA:
${safeList(companyEquipment)?.map((eq: any) => `  • ${eq.nombre} | Tipo: ${eq.tipo} | Cantidad: ${eq.cantidad || 1} | Estado: ${eq.estado || 'N/A'} | Desc: ${eq.descripcion || 'N/A'}`).join('\n') || '  Sin equipamiento registrado'}
` : 'No se proporcionaron datos de empresa. Realizar análisis sin comparativa.';

    const systemPrompt = `Eres el motor estratégico de PLIEGO SMART. Actúas como un comité evaluador + asesor jurídico + director técnico + analista financiero + estratega competitivo trabajando de forma coordinada.

═══════════════════════════════════════════════════════
INSTRUCCIÓN CRÍTICA - LECTURA EXHAUSTIVA DE DOCUMENTOS
═══════════════════════════════════════════════════════

DEBES LEER Y ANALIZAR EXHAUSTIVAMENTE TODO EL CONTENIDO DE LOS DOCUMENTOS ADJUNTOS (PDFs, DOCX, XLSX).

Tu análisis DEBE basarse PRIMORDIALMENTE en el contenido REAL de los documentos. NO te bases solo en los metadatos proporcionados (título, importe, entidad). Los metadatos son orientativos; la VERDAD está en los documentos.

Para CADA sección del informe:
- EXTRAE datos concretos del documento (artículos, cláusulas, importes, plazos, requisitos específicos).
- CITA referencias específicas cuando sea posible (ej: "Según cláusula 12.3 del Pliego Administrativo...").
- Si un dato aparece en el documento pero NO en los metadatos, USA el dato del documento.
- Si un dato es contradictorio entre metadatos y documento, PREVALECE el del documento.
- NO digas "no especificado" si la información SÍ está en el documento.

═══════════════════════════════════════════════════════
ARQUITECTURA DE ANÁLISIS EN 4 CAPAS
═══════════════════════════════════════════════════════

CAPA 1 – EXTRACCIÓN ESTRUCTURADA DEL DOCUMENTO:
- Lee el documento COMPLETO, no solo el inicio.
- Identifica todas las secciones: pliego administrativo, técnico, anexos, cuadros de características.
- Clasifica cada cláusula por tipo.
- Detecta TODAS las fechas críticas (apertura, presentación, ejecución, garantías).
- Identifica formularios y anexos obligatorios.
- Detecta contradicciones internas entre secciones.
- Detecta requisitos ocultos o dispersos en diferentes partes del documento.

CAPA 2 – CLASIFICACIÓN SECTORIAL:
Detecta automáticamente el sector entre: Obras Civiles, Energía, Agua y Saneamiento, Tecnología, Sanidad, Servicios Generales, Industrial, Transporte, Telecomunicaciones, Ambiental, Arquitectura, Facility Management.

Activa lógica sectorial específica:
- Obras Civiles: dirección de obra, seguridad y salud, planificación Gantt, mediciones, redeterminación de precios, penalidades.
- Energía: normativa eléctrica, habilitaciones, certificaciones técnicas, mantenimiento preventivo.
- Tecnología: SLA, ciberseguridad, arquitectura, GDPR, escalabilidad, integraciones.
- Agua: normativa hidráulica, caudales, bombeo, impacto ambiental.
- Sanidad: equipamiento homologado, protocolos, trazabilidad.
- Servicios: KPIs, cobertura territorial, supervisión.

CAPA 3 – CRUCE CON EMPRESA (si hay datos):
- Matching REAL de experiencia vs experiencia exigida en el pliego.
- Matching de facturación vs solvencia económica exigida.
- Matching de equipo técnico vs perfiles requeridos.
- Matching de certificaciones vs certificaciones exigidas o puntuables.
- Matching de equipamiento vs medios materiales exigidos.
- Clasificar cumplimiento: total, parcial, no_cumple con justificación concreta.

CAPA 4 – MOTOR DE ESTRATEGIA COMPETITIVA:
- Optimización de criterios automáticos (fórmulas económicas, experiencia cuantificable).
- Optimización de criterios subjetivos (memoria técnica, mejoras, innovación).
- Estrategia económica (rango recomendado, riesgo de baja temeraria).
- Plan de narrativa técnica.
- Mejoras técnicas diferenciales viables.

═══════════════════════════════════════════════════════
MODELO DE SCORING
═══════════════════════════════════════════════════════

IAT (Índice de Adecuación Técnica) 0-100:
Calcula basándote en datos REALES del pliego vs empresa:
- Experiencia similar ponderada (¿cumple contratos similares en importe y tipo?)
- Equipo técnico ponderado (¿tiene los perfiles exigidos?)
- Medios técnicos ponderados (¿dispone del equipamiento requerido?)
- Certificaciones (¿tiene las exigidas y las puntuables?)
Escala: >85 Alta competitividad | 65-85 Media | <65 Riesgo alto

IRE (Índice de Riesgo de Exclusión) 0-100 (0=sin riesgo, 100=exclusión segura):
Evalúa CADA causa de exclusión encontrada en el pliego:
- Clasificación empresarial insuficiente
- Solvencia económica insuficiente
- Solvencia técnica insuficiente
- Falta de garantías
- Requisitos administrativos incumplidos
- Habilitaciones o registros faltantes

PEA (Probabilidad Estimada de Adjudicación) 0-100:
f(IAT + Competitividad económica estimada + Capacidad en juicio de valor + Nivel de competencia sectorial)

Recomendación: alta (>70 PEA) | media (40-70) | baja (20-40) | no_recomendable (<20)

═══════════════════════════════════════════════════════
REGLAS CRÍTICAS
═══════════════════════════════════════════════════════
- NO simplifiques el análisis.
- NO omitas ningún apartado.
- NO entregues información genérica que no provenga del documento.
- NO inventes datos que no estén en el documento o en los datos de empresa.
- Si un requisito aparece en el documento, INCLÚYELO aunque sea menor.
- Cada criterio de adjudicación debe tener su ponderación EXACTA del documento.
- Las fórmulas económicas deben transcribirse TAL CUAL aparecen en el pliego.
- Los plazos y fechas deben ser los REALES del documento.
- TRAZABILIDAD DE FUENTES: Para CADA dato relevante, incluye el campo "fuente" indicando el nombre del documento y sección/cláusula de donde se extrajo (ej: "Resolución y Pliego, cláusula 12.3"). Esto es OBLIGATORIO en requisitos, criterios, riesgos, datos contractuales y solvencia.

Usa tool calling para devolver el resultado estructurado.`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    const docsInMainPrompt = useStagedDocAnalysis
      ? docsForAi.map((d: any) => ({ file_name: d.file_name, mime: getMimeForAI(d.file_name, d.mime_type) }))
      : attachedDocs;

    const docListDetail = docsInMainPrompt.map((d, i) => `  DOCUMENTO ${i + 1}: "${d.file_name}" (${d.mime})`).join('\n');

    const stagedSummariesBlock = useStagedDocAnalysis
      ? `\n\nEXTRACCIONES DOCUMENTALES PREVIAS (OBLIGATORIO USAR TODAS EN EL INFORME):\n${documentSummaries.join('\n\n------------------------\n\n') || 'Sin extracciones disponibles'}`
      : "";

    const tenderText = `ANALIZA EXHAUSTIVAMENTE **TODOS** los documentos adjuntos del siguiente expediente de licitación.

═══════════════════════════════════════════════════════
⚠️ INSTRUCCIÓN CRÍTICA: ANÁLISIS INTEGRAL MULTI-DOCUMENTO
═══════════════════════════════════════════════════════

MODO DE PROCESAMIENTO: ${useStagedDocAnalysis ? "staged_multi_doc" : "inline_multi_doc"}
Se han considerado ${docsInMainPrompt.length} documento(s). DEBES integrar CADA UNO en el análisis final:
${docListDetail}

REGLAS DE ANÁLISIS MULTI-DOCUMENTO:
1. Lee TODOS los documentos, no solo el primero o el último.
2. Cada documento puede contener información DIFERENTE y COMPLEMENTARIA.
3. Uno puede ser el pliego administrativo, otro el técnico, otro una resolución, anexos, etc.
4. COMBINA la información de TODOS los documentos en un análisis INTEGRAL.
5. Si un dato aparece en un documento pero no en otro, INCLÚYELO.
6. Si hay contradicciones entre documentos, SEÑÁLALAS explícitamente.
7. En tu análisis, REFERENCIA de qué documento proviene cada dato importante.
8. NO te limites a analizar solo un documento. Si hay 3, analiza los 3 completamente.

METADATOS DE REFERENCIA (verificar y corregir con datos de los documentos):
- Título: "${tenderInfo?.title || 'Sin título'}"
- Entidad contratante: "${tenderInfo?.contracting_entity || 'No especificada'}"
- Importe: ${tenderInfo?.contract_amount || 'No especificado'}€
- Valor estimado: ${tenderInfo?.valor_estimado || 'No especificado'}€
- Duración: ${tenderInfo?.duration || 'No especificada'}
- Plazo presentación: ${tenderInfo?.submission_deadline || 'No especificado'}
- Garantía provisional: ${tenderInfo?.garantia_provisional || 'No especificada'}€
- Garantía definitiva: ${tenderInfo?.garantia_definitiva || 'No especificada'}€
- Clasificación requerida: ${tenderInfo?.clasificacion_requerida || 'No especificada'}

DOCUMENTOS EN EXPEDIENTE: ${supportedDocs.map(d => d.file_name).join(', ') || 'Ninguno'}
DOCUMENTOS PROCESADOS EN ESTA EJECUCIÓN: ${docsInMainPrompt.map(d => d.file_name).join(', ') || 'Ninguno'}
${skippedDocs.length ? `DOCUMENTOS NO PROCESADOS: ${skippedDocs.join('; ')}` : ''}
${stagedSummariesBlock}

INSTRUCCIÓN FINAL: Genera un informe integral consolidado usando todos los documentos y/o extracciones previas. Si los datos de los documentos difieren de los metadatos, USA los de los documentos.

${companyContext}`;

    if (!useStagedDocAnalysis && attachedDocs.length > 0) {
      const userContent: any[] = [{ type: "text", text: tenderText }];
      for (const doc of attachedDocs) {
        userContent.push({
          type: "file",
          file: { filename: doc.file_name, file_data: `data:${doc.mime};base64,${doc.base64}` },
        });
      }
      messages.push({ role: "user", content: userContent });
    } else {
      messages.push({
        role: "user",
        content:
          tenderText +
          (docsInMainPrompt.length === 0
            ? "\n\nADVERTENCIA: No se pudieron procesar documentos. El análisis se basa únicamente en metadatos y datos de empresa."
            : ""),
      });
    }

    const tools = [{
      type: "function",
      function: {
        name: "generar_informe_pliego",
        description: "Genera el informe completo de análisis del pliego con todas las secciones obligatorias, scoring y datos extraídos directamente del documento.",
        parameters: {
          type: "object",
          properties: {
            sector_detectado: { type: "string", description: "Sector industrial detectado del contenido del pliego" },
            resumen_ejecutivo: { type: "string", description: "Resumen ejecutivo estratégico (5-8 frases) basado en el contenido real del documento. Incluir objeto del contrato, importe, plazos clave, y valoración estratégica." },
            datos_contractuales: {
              type: "object",
              properties: {
                objeto_contrato: { type: "string", description: "Objeto COMPLETO del contrato tal como figura en el pliego" },
                entidad_contratante: { type: "string" },
                presupuesto_base: { type: "string" },
                valor_estimado: { type: "string" },
                duracion: { type: "string" },
                prorrogas: { type: "string", description: "Prórrogas previstas si las hay" },
                plazo_presentacion: { type: "string" },
                tipo_contrato: { type: "string" },
                procedimiento: { type: "string", description: "Tipo de procedimiento (abierto, restringido, negociado, etc.)" },
                garantia_provisional: { type: "string" },
                garantia_definitiva: { type: "string" },
                clasificacion_requerida: { type: "string" },
                lote: { type: "string", description: "Información sobre lotes si aplica" },
                revision_precios: { type: "string", description: "Si hay revisión de precios y fórmula aplicable" },
                penalidades: { type: "string", description: "Penalidades por incumplimiento si se especifican" },
                subcontratacion: { type: "string", description: "Condiciones de subcontratación si se especifican" },
                fuentes: { type: "string", description: "Nombres de los documentos de donde se extrajeron estos datos contractuales, con cláusulas/secciones de referencia" },
              },
              required: ["objeto_contrato"],
              additionalProperties: false,
            },
            requisitos_administrativos: {
              type: "array", items: {
                type: "object",
                properties: {
                  descripcion: { type: "string", description: "Descripción detallada del requisito TAL COMO aparece en el pliego" },
                  obligatorio: { type: "boolean" },
                  normativa: { type: "string", description: "Normativa aplicable si se menciona" },
                  riesgo_exclusion: { type: "string", enum: ["alto", "medio", "bajo"] },
                  fuente: { type: "string", description: "Nombre del documento y cláusula/sección de donde se extrajo este requisito (ej: 'Pliego Administrativo, cláusula 8.2')" },
                },
                required: ["descripcion"], additionalProperties: false,
              }
            },
            requisitos_tecnicos: {
              type: "array", items: {
                type: "object",
                properties: {
                  descripcion: { type: "string", description: "Descripción detallada del requisito técnico" },
                  experiencia_minima: { type: "string", description: "Experiencia mínima exigida con detalle (años, importes, tipo)" },
                  equipo_minimo: { type: "string", description: "Personal mínimo exigido con perfiles" },
                  medios_minimos: { type: "string", description: "Medios materiales mínimos requeridos" },
                  fuente: { type: "string", description: "Nombre del documento y sección de donde se extrajo este requisito técnico" },
                },
                required: ["descripcion"], additionalProperties: false,
              }
            },
            solvencia: {
              type: "object",
              properties: {
                economica: { type: "array", items: { type: "object", properties: { texto: { type: "string" }, fuente: { type: "string", description: "Documento y cláusula de origen" } }, required: ["texto"], additionalProperties: false }, description: "Requisitos de solvencia económica con cifras exactas del pliego" },
                tecnica: { type: "array", items: { type: "object", properties: { texto: { type: "string" }, fuente: { type: "string", description: "Documento y cláusula de origen" } }, required: ["texto"], additionalProperties: false }, description: "Requisitos de solvencia técnica con datos concretos" },
                profesional: { type: "array", items: { type: "object", properties: { texto: { type: "string" }, fuente: { type: "string", description: "Documento y cláusula de origen" } }, required: ["texto"], additionalProperties: false }, description: "Requisitos de solvencia profesional" },
              },
              additionalProperties: false,
            },
            criterios_adjudicacion: {
              type: "array", items: {
                type: "object",
                properties: {
                  criterio: { type: "string", description: "Nombre del criterio TAL COMO aparece en el pliego" },
                  tipo: { type: "string", enum: ["automatico", "juicio_valor"] },
                  ponderacion: { type: "number", description: "Ponderación EXACTA en puntos según el pliego" },
                  formula: { type: "string", description: "Fórmula matemática EXACTA si es criterio automático" },
                  subapartados: { type: "string", description: "Desglose de subapartados si los hay" },
                  fuente: { type: "string", description: "Nombre del documento y sección/cláusula donde aparece este criterio" },
                },
                required: ["criterio", "tipo", "ponderacion"], additionalProperties: false,
              }
            },
            analisis_sectorial: { type: "string", description: "Análisis específico del sector con normativa aplicable, riesgos sectoriales, claves para maximizar puntuación y documentación diferencial recomendada. Mínimo 200 palabras." },
            comparativa_empresa: {
              type: "object",
              properties: {
                cumplimiento: { type: "string", enum: ["total", "parcial", "no_cumple"] },
                fortalezas: { type: "array", items: { type: "string" }, description: "Fortalezas CONCRETAS de la empresa frente a este pliego específico" },
                brechas: { type: "array", items: { type: "string" }, description: "Brechas CONCRETAS identificadas con referencia al requisito incumplido" },
                observaciones: { type: "string" },
                acciones_recomendadas: { type: "string", description: "Acciones correctivas específicas y viables" },
              },
              additionalProperties: false,
            },
            riesgos: {
              type: "array", items: {
                type: "object",
                properties: {
                  tipo: { type: "string", enum: ["juridico", "tecnico", "economico"] },
                  descripcion: { type: "string", description: "Riesgo concreto identificado en el pliego" },
                  nivel: { type: "string", enum: ["alto", "medio", "bajo"] },
                  mitigacion: { type: "string", description: "Medida de mitigación específica y aplicable" },
                  fuente: { type: "string", description: "Documento y cláusula donde se identificó este riesgo" },
                },
                required: ["tipo", "descripcion", "nivel"], additionalProperties: false,
              }
            },
            estrategia: {
              type: "object",
              properties: {
                economica: { type: "string", description: "Estrategia económica detallada: rango recomendado de oferta, análisis de baja temeraria, impacto en puntuación. Basado en la fórmula del pliego." },
                tecnica: { type: "string", description: "Estrategia técnica: cómo maximizar puntuación en juicio de valor, qué destacar, qué estructura usar en la memoria." },
                mejoras_propuestas: { type: "string", description: "Mejoras técnicas concretas y viables que aporten puntuación diferencial." },
                narrativa_recomendada: { type: "string", description: "Estructura narrativa recomendada para la memoria técnica." },
              },
              additionalProperties: false,
            },
            checklist_documental: { type: "array", items: { type: "string" }, description: "Lista COMPLETA de documentos a presentar, extraída del pliego. Incluir cada documento individual." },
            recomendaciones_presentacion: { type: "array", items: { type: "string" }, description: "Recomendaciones específicas para la presentación electrónica y documental." },
            scoring: {
              type: "object",
              properties: {
                iat: { type: "number", description: "Índice de Adecuación Técnica 0-100 calculado con datos reales" },
                ire: { type: "number", description: "Índice de Riesgo de Exclusión 0-100 basado en requisitos concretos del pliego" },
                pea: { type: "number", description: "Probabilidad Estimada de Adjudicación 0-100" },
                iat_detalle: { type: "string", description: "Justificación detallada del IAT con datos concretos" },
                ire_detalle: { type: "string", description: "Justificación del IRE: qué requisitos se cumplen y cuáles no" },
                pea_detalle: { type: "string", description: "Justificación del PEA con factores considerados" },
                recomendacion_presentarse: { type: "string", enum: ["alta", "media", "baja", "no_recomendable"] },
              },
              required: ["iat", "ire", "pea", "recomendacion_presentarse"],
              additionalProperties: false,
            },
          },
          required: ["sector_detectado", "resumen_ejecutivo", "datos_contractuales", "requisitos_administrativos", "requisitos_tecnicos", "criterios_adjudicacion", "riesgos", "estrategia", "scoring", "checklist_documental", "recomendaciones_presentacion"],
          additionalProperties: false,
        },
      },
    }];

    console.log(`Sending analysis request to AI. mode=${useStagedDocAnalysis ? "staged" : "inline"}, docs=${docsInMainPrompt.length}, payload=${Math.round(totalPayloadSize / 1024)}KB, model=google/gemini-2.5-pro`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages,
        tools,
        tool_choice: { type: "function", function: { name: "generar_informe_pliego" } },
        temperature: 0.1,
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
        const content = aiData.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
        reportData = JSON.parse(jsonMatch[1].trim());
      }
    } catch {
      reportData = { raw_analysis: aiData.choices?.[0]?.message?.content || "Error parsing", parse_error: true };
    }

    // Store structured data in sub-tables
    const tenderId = report.tender_id;

    // Clean previous generated rows to avoid duplicates on retries
    await Promise.all([
      supabase.from("tender_requirements_admin").delete().eq("tender_id", tenderId),
      supabase.from("tender_requirements_tech").delete().eq("tender_id", tenderId),
      supabase.from("tender_criteria").delete().eq("tender_id", tenderId),
      supabase.from("tender_risks").delete().eq("tender_id", tenderId),
      supabase.from("tender_strategy").delete().eq("tender_id", tenderId),
      supabase.from("tender_matching").delete().eq("tender_id", tenderId),
    ]);

    const persistenceOps = [];

    // Update tender with data extracted from document
    const tenderUpdate: any = {};
    if (reportData.sector_detectado) tenderUpdate.sector = reportData.sector_detectado;
    if (reportData.datos_contractuales) {
      const dc = reportData.datos_contractuales;
      if (dc.entidad_contratante) tenderUpdate.contracting_entity = dc.entidad_contratante;
      if (dc.duracion) tenderUpdate.duration = dc.duracion;
      if (dc.clasificacion_requerida) tenderUpdate.clasificacion_requerida = dc.clasificacion_requerida;
    }
    if (Object.keys(tenderUpdate).length > 0) {
      persistenceOps.push(supabase.from("tenders").update(tenderUpdate).eq("id", tenderId));
    }

    // Save admin requirements
    if (reportData.requisitos_administrativos?.length) {
      persistenceOps.push(
        supabase.from("tender_requirements_admin").insert(
          reportData.requisitos_administrativos.map((r: any) => ({
            tender_id: tenderId,
            descripcion: r.descripcion,
            obligatorio: r.obligatorio ?? true,
            normativa_aplicable: r.normativa,
            riesgo_exclusion: r.riesgo_exclusion || "medio",
          })),
        ),
      );
    }

    // Save tech requirements
    if (reportData.requisitos_tecnicos?.length) {
      persistenceOps.push(
        supabase.from("tender_requirements_tech").insert(
          reportData.requisitos_tecnicos.map((r: any) => ({
            tender_id: tenderId,
            descripcion: r.descripcion,
            experiencia_minima: r.experiencia_minima,
            equipo_minimo: r.equipo_minimo,
            medios_minimos: r.medios_minimos,
          })),
        ),
      );
    }

    // Save criteria
    if (reportData.criterios_adjudicacion?.length) {
      persistenceOps.push(
        supabase.from("tender_criteria").insert(
          reportData.criterios_adjudicacion.map((c: any) => ({
            tender_id: tenderId,
            tipo: c.tipo,
            descripcion: c.criterio,
            ponderacion: c.ponderacion,
            formula: c.formula,
          })),
        ),
      );
    }

    // Save risks
    if (reportData.riesgos?.length) {
      persistenceOps.push(
        supabase.from("tender_risks").insert(
          reportData.riesgos.map((r: any) => ({
            tender_id: tenderId,
            tipo: r.tipo,
            descripcion: r.descripcion,
            nivel: r.nivel,
            mitigacion: r.mitigacion,
          })),
        ),
      );
    }

    // Save strategy
    if (reportData.estrategia) {
      persistenceOps.push(
        supabase.from("tender_strategy").insert({
          tender_id: tenderId,
          estrategia_economica: reportData.estrategia.economica,
          estrategia_tecnica: reportData.estrategia.tecnica,
          mejoras_propuestas: reportData.estrategia.mejoras_propuestas,
          narrativa_recomendada: reportData.estrategia.narrativa_recomendada,
        }),
      );
    }

    // Save matching
    if (reportData.comparativa_empresa && company) {
      persistenceOps.push(
        supabase.from("tender_matching").insert({
          tender_id: tenderId,
          company_id: report.company_id,
          cumplimiento: reportData.comparativa_empresa.cumplimiento,
          iat_score: reportData.scoring?.iat || 0,
          ire_score: reportData.scoring?.ire || 0,
          pea_score: reportData.scoring?.pea || 0,
          riesgo: reportData.scoring?.recomendacion_presentarse,
          observaciones: reportData.comparativa_empresa.observaciones,
          acciones_recomendadas: reportData.comparativa_empresa.acciones_recomendadas,
          fortalezas: reportData.comparativa_empresa.fortalezas || [],
          brechas: reportData.comparativa_empresa.brechas || [],
        }),
      );
    }

    await Promise.all(persistenceOps);

    // Update report and tender status
    await Promise.all([
      supabase
        .from("analysis_reports")
        .update({ status: "completed", report_data: reportData, updated_at: new Date().toISOString() })
        .eq("id", reportId),
      supabase.from("tenders").update({ status: "completed" }).eq("id", tenderId),
    ]);

    console.log(`Analysis completed. Docs processed: ${attachedDocs.length}. Sector: ${reportData.sector_detectado}. IAT: ${reportData.scoring?.iat}, IRE: ${reportData.scoring?.ire}, PEA: ${reportData.scoring?.pea}`);

    return new Response(JSON.stringify({ success: true, report_data: reportData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-tender error:", e);

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && supabaseKey) {
        const adminClient = createClient(supabaseUrl, supabaseKey);
        const updates = [];

        if (reportId) {
          updates.push(
            adminClient
              .from("analysis_reports")
              .update({
                status: "error",
                report_data: { error: e instanceof Error ? e.message : "Unknown error" },
                updated_at: new Date().toISOString(),
              })
              .eq("id", reportId),
          );
        }

        if (tenderIdForStatus) {
          updates.push(adminClient.from("tenders").update({ status: "error" }).eq("id", tenderIdForStatus));
        }

        await Promise.all(updates);
      }
    } catch (statusError) {
      console.error("Failed to update analysis status:", statusError);
    }

    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
