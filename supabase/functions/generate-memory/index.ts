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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    if (!supabaseUrl || !supabaseAnonKey) throw new Error("Backend keys not configured");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { tenderId, companyId } = await req.json();
    if (!tenderId || !companyId) throw new Error("tenderId and companyId required");

    // Fetch all context
    const [tenderRes, reportRes, companyRes, certsRes, expRes, teamRes, criteriaRes, strategyRes] = await Promise.all([
      supabase.from("tenders").select("*").eq("id", tenderId).single(),
      supabase.from("analysis_reports").select("report_data").eq("tender_id", tenderId).eq("status", "completed").order("created_at", { ascending: false }).limit(1).single(),
      supabase.from("companies").select("*").eq("id", companyId).single(),
      supabase.from("company_certifications").select("*").eq("company_id", companyId),
      supabase.from("company_experience").select("*").eq("company_id", companyId),
      supabase.from("company_team").select("*").eq("company_id", companyId),
      supabase.from("tender_criteria").select("*").eq("tender_id", tenderId),
      supabase.from("tender_strategy").select("*").eq("tender_id", tenderId).limit(1).single(),
    ]);

    const tender = tenderRes.data as any;
    const report = reportRes.data?.report_data as any;
    const company = companyRes.data as any;
    const sector = tender?.sector || report?.sector_detectado || "General";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Eres el generador de memorias técnicas de PLIEGO SMART. Generas memorias técnicas sectoriales completas, profesionales y listas para presentar.

REGLAS:
- La memoria debe estar adaptada al pliego específico, la empresa y los criterios de puntuación.
- No generes texto genérico. Cada sección debe referenciar datos reales del pliego y la empresa.
- Usa un tono profesional, técnico y persuasivo.
- Estructura con encabezados claros en Markdown.
- Incluye datos cuantitativos cuando estén disponibles.

SECTOR DETECTADO: ${sector}

${sector === "Obras Civiles" ? `ESTRUCTURA PARA OBRAS CIVILES:
1. Introducción estratégica alineada al objeto del contrato
2. Análisis del entorno y condiciones del proyecto
3. Metodología constructiva detallada
4. Planificación con hitos (cronograma tipo Gantt descriptivo)
5. Plan de control de calidad
6. Plan de seguridad y salud
7. Gestión ambiental
8. Mejoras técnicas viables y diferenciadores
9. Gestión de riesgos
10. Equipo técnico propuesto con CVs resumidos
11. Medios materiales y maquinaria` :

sector === "Tecnología" ? `ESTRUCTURA PARA TECNOLOGÍA:
1. Comprensión del proyecto y objetivos
2. Arquitectura propuesta (diagrama descriptivo)
3. Modelo de despliegue e implementación
4. SLA detallado con métricas
5. Ciberseguridad y protección de datos (GDPR)
6. Plan de contingencia y continuidad
7. Escalabilidad y rendimiento
8. Integraciones con sistemas existentes
9. Equipo técnico con certificaciones
10. Mejoras técnicas diferenciadores
11. Cronograma de implementación` :

`ESTRUCTURA GENERAL:
1. Introducción y comprensión del objeto del contrato
2. Metodología de trabajo
3. Planificación y cronograma
4. Equipo técnico propuesto
5. Medios técnicos y materiales
6. Control de calidad
7. Gestión de riesgos
8. Mejoras técnicas propuestas
9. Plan de seguimiento y KPIs
10. Valor añadido diferencial`}`;

    const userPrompt = `Genera la memoria técnica para:

PLIEGO: ${tender?.title || 'Sin título'}
Entidad: ${tender?.contracting_entity || 'N/A'}
Importe: ${tender?.contract_amount || 'N/A'}€
Duración: ${tender?.duration || 'N/A'}

EMPRESA: ${company?.name || 'N/A'}
Facturación: ${company?.facturacion_anual || 'N/A'}€
Clasificación: ${company?.clasificacion_empresarial || 'N/A'}
Sectores: ${company?.sectores_actividad?.join(', ') || 'N/A'}

CERTIFICACIONES: ${certsRes.data?.map((c: any) => c.nombre).join(', ') || 'Ninguna'}
EXPERIENCIA: ${expRes.data?.map((e: any) => `${e.titulo} (${e.importe || 'N/A'}€)`).join('; ') || 'No registrada'}
EQUIPO: ${teamRes.data?.map((t: any) => `${t.nombre} - ${t.cargo || 'N/A'} (${t.experiencia_anos || 0} años)`).join('; ') || 'No registrado'}

CRITERIOS DE ADJUDICACIÓN:
${criteriaRes.data?.map((c: any) => `- ${c.descripcion} (${c.tipo}, ${c.ponderacion}%)`).join('\n') || 'No disponibles'}

ESTRATEGIA RECOMENDADA:
${strategyRes.data ? `Económica: ${strategyRes.data.estrategia_economica || 'N/A'}\nTécnica: ${strategyRes.data.estrategia_tecnica || 'N/A'}\nMejoras: ${strategyRes.data.mejoras_propuestas || 'N/A'}` : 'No disponible'}

${report?.resumen_ejecutivo ? `RESUMEN DEL ANÁLISIS: ${report.resumen_ejecutivo}` : ''}

Genera la memoria técnica completa en Markdown, adaptada al sector ${sector}, maximizando la puntuación en criterios de juicio de valor.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Límite de solicitudes excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Save technical memory
    const { data: memory, error: memError } = await supabase.from("technical_memories").insert({
      tender_id: tenderId, company_id: companyId, content, sector, status: "generated", created_by: user.id,
    }).select("id").single();

    if (memError) throw memError;

    return new Response(JSON.stringify({ success: true, memory_id: memory.id, content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-memory error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
