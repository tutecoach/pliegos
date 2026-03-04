import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const { reportId } = await req.json();
    if (!reportId) throw new Error("reportId is required");

    // Get the report with tender info
    const { data: report, error: reportError } = await supabase
      .from("analysis_reports")
      .select("*, tenders(title, contracting_entity, contract_amount, duration, submission_deadline)")
      .eq("id", reportId)
      .single();

    if (reportError || !report) throw new Error("Report not found");

    // Get uploaded documents metadata
    const { data: docs } = await supabase
      .from("tender_documents")
      .select("file_name, file_path, file_size, mime_type")
      .eq("tender_id", report.tender_id);

    // Download PDF content for analysis
    let pdfTexts: string[] = [];
    if (docs && docs.length > 0) {
      for (const doc of docs) {
        const { data: fileData } = await supabase.storage
          .from("tender-documents")
          .download(doc.file_path);
        if (fileData) {
          // Extract text from PDF bytes - send raw to AI for multimodal analysis
          const bytes = await fileData.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
          pdfTexts.push(base64);
        }
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const tenderInfo = report.tenders as any;
    const systemPrompt = `Eres un analista experto en licitaciones públicas españolas. Analiza el pliego de condiciones proporcionado y genera un informe estructurado en JSON con las siguientes secciones:

1. "resumen_ejecutivo": Resumen breve del objeto del contrato (2-3 frases).
2. "datos_generales": { "objeto_contrato", "entidad_contratante", "presupuesto_base", "duracion", "plazo_presentacion", "tipo_contrato", "procedimiento" }
3. "requisitos_solvencia": { "economica": [...], "tecnica": [...], "profesional": [...] }
4. "criterios_adjudicacion": [{ "criterio", "ponderacion", "tipo": "automatico|juicio_valor" }]
5. "requisitos_tecnicos": Lista de requisitos técnicos clave extraídos del pliego.
6. "documentacion_requerida": Lista de documentos que deben presentarse.
7. "riesgos_identificados": [{ "riesgo", "nivel": "alto|medio|bajo", "mitigacion" }]
8. "recomendaciones": Lista de recomendaciones estratégicas para la presentación de la oferta.
9. "puntuacion_viabilidad": Número del 1-100 estimando la viabilidad de presentar oferta.

Responde SOLO con JSON válido. Si no puedes extraer algún dato, indica "No especificado".`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // Build user message with PDF content or metadata
    if (pdfTexts.length > 0) {
      // Use multimodal with file content
      const userContent: any[] = [
        {
          type: "text",
          text: `Analiza el siguiente pliego de licitación. Título: "${tenderInfo?.title || 'Sin título'}". Entidad contratante: "${tenderInfo?.contracting_entity || 'No especificada'}". Importe: ${tenderInfo?.contract_amount || 'No especificado'}€. Duración: ${tenderInfo?.duration || 'No especificada'}. Documentos adjuntos: ${docs?.map(d => d.file_name).join(', ')}.`,
        },
      ];

      // Add PDF as inline_data for Gemini
      for (let i = 0; i < pdfTexts.length; i++) {
        userContent.push({
          type: "file",
          file: {
            filename: docs![i].file_name,
            file_data: `data:application/pdf;base64,${pdfTexts[i]}`,
          },
        });
      }

      messages.push({ role: "user", content: userContent });
    } else {
      messages.push({
        role: "user",
        content: `Analiza esta licitación basándote en los datos disponibles. Título: "${tenderInfo?.title || 'Sin título'}". Entidad contratante: "${tenderInfo?.contracting_entity || 'No especificada'}". Importe: ${tenderInfo?.contract_amount || 'No especificado'}€. Duración: ${tenderInfo?.duration || 'No especificada'}. No hay documentos PDF adjuntos, genera un análisis basado en los metadatos disponibles.`,
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        await supabase.from("analysis_reports").update({ status: "error", report_data: { error: "Rate limit exceeded" } }).eq("id", reportId);
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido. Inténtalo de nuevo en unos minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        await supabase.from("analysis_reports").update({ status: "error", report_data: { error: "Payment required" } }).eq("id", reportId);
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response
    let reportData: any;
    try {
      // Extract JSON from possible markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      reportData = JSON.parse(jsonMatch[1].trim());
    } catch {
      reportData = { raw_analysis: content, parse_error: true };
    }

    // Update report
    await supabase
      .from("analysis_reports")
      .update({ status: "completed", report_data: reportData, updated_at: new Date().toISOString() })
      .eq("id", reportId);

    return new Response(JSON.stringify({ success: true, report_data: reportData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-tender error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
