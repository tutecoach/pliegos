import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ensureCompanySetupForUser } from "@/lib/company-setup";

import type { TenderFormData } from "@/schemas/tender.schema";

export type AnalysisStep = "info" | "upload" | "analyzing" | "results";

/**
 * Hook central para el flujo de NewAnalysis.
 * Separa toda la lógica de negocio del componente de UI.
 */
export function useNewAnalysis() {
  const { user } = useAuth();
  const { currencyOption } = useCurrency();
  const navigate = useNavigate();

  const [step, setStep] = useState<AnalysisStep>("info");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [allCompanies, setAllCompanies] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [planTier, setPlanTier] = useState<string>("starter");

  // El estado del form es gestionado por TenderInfoForm (react-hook-form)
  // Aquí solo guardamos el projectId por defecto para inicializar el form
  const [defaultProjectId, setDefaultProjectId] = useState("");

  const [tenderId, setTenderId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<unknown>(null);
  const [lastFormData, setLastFormData] = useState<TenderFormData | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [uploadedDocsCount, setUploadedDocsCount] = useState(0);
  const [startingAnalysis, setStartingAnalysis] = useState(false);

  const loadCompaniesForUser = async (userId: string) => {
    const [ucRes, profileRes] = await Promise.all([
      supabase.from("user_companies").select("company_id").eq("user_id", userId),
      supabase.from("profiles").select("company_id, plan_tier").eq("user_id", userId).single(),
    ]);
    const companyIds = new Set<string>();
    const profileData = profileRes.data as Record<string, unknown> | null;
    if (profileData?.company_id) companyIds.add(profileData.company_id as string);
    (ucRes.data || []).forEach((uc: Record<string, unknown>) => companyIds.add(uc.company_id as string));
    setPlanTier((profileData?.plan_tier as string) || "starter");
    if (companyIds.size > 0) {
      const { data: companiesData } = await supabase
        .from("companies").select("id, name").in("id", Array.from(companyIds));
      setAllCompanies(companiesData || []);
    }
    return (profileData?.company_id as string) || null;
  };

  const loadProjectsForCompany = async (cId: string) => {
    const { data } = await supabase.from("projects").select("id, name").eq("company_id", cId).is("deleted_at", null);
    setProjects(data || []);
    if (data && data.length > 0) setDefaultProjectId(data[0].id);
  };

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const { companyId: ensuredId, projects: ensuredProjects, defaultProjectId: defaultProjId } = await ensureCompanySetupForUser(user.id);
        setCompanyId(ensuredId);
        setProjects(ensuredProjects);
        setDefaultProjectId(defaultProjId);
        await loadCompaniesForUser(user.id);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "No se pudo preparar empresa/proyecto.";
        toast({ title: "Error de configuración", description: msg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCompanySwitch = async (newCompanyId: string) => {
    setCompanyId(newCompanyId);
    await loadProjectsForCompany(newCompanyId);
  };

  /**
   * createTender recibe los datos ya validados por TenderInfoForm (react-hook-form + Zod).
   * Ya no valida manualmente — Zod lo hizo antes de llamar aquí.
   */
  const createTender = async (formData: TenderFormData) => {
    if (!companyId || !formData.projectId) {
      toast({ title: "Error de configuración", description: "No se pudo vincular tu empresa.", variant: "destructive" });
      return;
    }
    // Guardamos los datos del form para mostrarlos en el step de resultados
    setLastFormData(formData);
    const { data: tender, error } = await supabase.from("tenders").insert({
      title: formData.title.trim(),
      company_id: companyId,
      project_id: formData.projectId,
      contracting_entity: formData.contractingEntity?.trim() || null,
      contract_amount: formData.contractAmount ? parseFloat(formData.contractAmount) : null,
      duration: formData.duration?.trim() || null,
      submission_deadline: formData.deadline || null,
      created_by: user?.id,
      sector: formData.sector || null,
      garantia_provisional: formData.garantiaProv ? parseFloat(formData.garantiaProv) : null,
      garantia_definitiva: formData.garantiaDef ? parseFloat(formData.garantiaDef) : null,
      clasificacion_requerida: formData.clasificacionReq || null,
      valor_estimado: formData.valorEstimado ? parseFloat(formData.valorEstimado) : null,
    }).select("id").single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setTenderId((tender as { id: string }).id);
    setUploadedDocsCount(0);
    setStep("upload");
  };

  const startAnalysis = async () => {
    if (!tenderId || !companyId || startingAnalysis) return;
    setStartingAnalysis(true);
    const { count: docsCount, error: docsError } = await supabase
      .from("tender_documents").select("id", { count: "exact", head: true }).eq("tender_id", tenderId);
    if (docsError || !docsCount || docsCount < 1) {
      toast({ title: "Sube al menos un PDF", description: "Necesitamos al menos un documento para ejecutar el análisis.", variant: "destructive" });
      setStartingAnalysis(false);
      return;
    }
    setStep("analyzing");
    const { data: report, error: reportError } = await supabase.from("analysis_reports")
      .insert({ tender_id: tenderId, company_id: companyId, created_by: user?.id, status: "processing" })
      .select("id").single();
    if (reportError) {
      toast({ title: "Error", description: reportError.message, variant: "destructive" });
      setStep("upload");
      setStartingAnalysis(false);
      return;
    }
    try {
      const { data, error: fnError } = await supabase.functions.invoke("analyze-tender", { body: { reportId: (report as { id: string }).id } });
      if (fnError) throw fnError;
      setReportData((data as { report_data: unknown }).report_data);
      setStep("results");
      if ((data as { report_data: Record<string, unknown> }).report_data?.modo_contingencia) {
        toast({
          title: "⚠️ Análisis en modo contingencia",
          description: "Se generó un informe preliminar porque los créditos de IA están agotados.",
          variant: "destructive",
        });
      } else {
        toast({ title: "¡Análisis completado!" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      toast({ title: "Error en el análisis", description: msg, variant: "destructive" });
      setStep("upload");
    } finally {
      setStartingAnalysis(false);
    }
  };

  return {
    step, setStep,
    loading,
    planTier,
    companyId,
    allCompanies,
    projects,
    defaultProjectId,
    tenderId,
    reportData,
    lastFormData,
    showSimulator, setShowSimulator,
    uploadedDocsCount, setUploadedDocsCount,
    startingAnalysis,
    currencySymbol: currencyOption.symbol,
    handleCompanySwitch,
    createTender,
    startAnalysis,
    navigateToDashboard: () => navigate("/dashboard"),
  };
}
