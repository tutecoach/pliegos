import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { ensureCompanySetupForUser } from "@/lib/company-setup";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import PdfUploader from "@/components/tender/PdfUploader";
import AnalysisReport from "@/components/tender/AnalysisReport";
import EconomicSimulator from "@/components/tender/EconomicSimulator";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Loader2, Sparkles, FileText, CheckCircle, BookOpen, Calculator, Building2 } from "lucide-react";

type Step = "info" | "upload" | "analyzing" | "results";

const SECTORES = [
  "Obras Civiles", "Energía", "Agua y Saneamiento", "Tecnología",
  "Sanidad", "Servicios Generales", "Industrial", "Transporte",
  "Telecomunicaciones", "Ambiental", "Arquitectura", "Facility Management",
];

const NewAnalysis = () => {
  const { user } = useAuth();
  const { currencyOption } = useCurrency();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("info");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [allCompanies, setAllCompanies] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [planTier, setPlanTier] = useState<string>("starter");

  const [title, setTitle] = useState("");
  const [contractingEntity, setContractingEntity] = useState("");
  const [contractAmount, setContractAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [deadline, setDeadline] = useState("");
  const [projectId, setProjectId] = useState("");
  const [sector, setSector] = useState("");
  const [garantiaProv, setGarantiaProv] = useState("");
  const [garantiaDef, setGarantiaDef] = useState("");
  const [clasificacionReq, setClasificacionReq] = useState("");
  const [valorEstimado, setValorEstimado] = useState("");

  const [tenderId, setTenderId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [uploadedDocsCount, setUploadedDocsCount] = useState(0);
  const [startingAnalysis, setStartingAnalysis] = useState(false);

  // Load all companies for the user (multi-company support)
  const loadCompaniesForUser = async (userId: string) => {
    const [ucRes, profileRes] = await Promise.all([
      supabase.from("user_companies").select("company_id").eq("user_id", userId),
      supabase.from("profiles").select("company_id, plan_tier").eq("user_id", userId).single(),
    ]);
    const companyIds = new Set<string>();
    if (profileRes.data?.company_id) companyIds.add(profileRes.data.company_id);
    (ucRes.data || []).forEach((uc: any) => companyIds.add(uc.company_id));
    setPlanTier(profileRes.data?.plan_tier || "starter");

    if (companyIds.size > 0) {
      const { data: companiesData } = await supabase
        .from("companies").select("id, name").in("id", Array.from(companyIds));
      setAllCompanies(companiesData || []);
    }
    return profileRes.data?.company_id || null;
  };

  const loadProjectsForCompany = async (cId: string) => {
    const { data } = await supabase.from("projects").select("id, name").eq("company_id", cId).is("deleted_at", null);
    setProjects(data || []);
    if (data && data.length > 0) setProjectId(data[0].id);
  };

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const { companyId: ensuredCompanyId, projects: ensuredProjects, defaultProjectId } = await ensureCompanySetupForUser(user.id);
        setCompanyId(ensuredCompanyId);
        setProjects(ensuredProjects);
        setProjectId(defaultProjectId);
        await loadCompaniesForUser(user.id);
      } catch (error: any) {
        toast({ title: "Error de configuración", description: error?.message || "No se pudo preparar empresa/proyecto.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleCompanySwitch = async (newCompanyId: string) => {
    setCompanyId(newCompanyId);
    await loadProjectsForCompany(newCompanyId);
  };

  const createTender = async () => {
    if (!title.trim()) { toast({ title: "El título es obligatorio", variant: "destructive" }); return; }
    if (!companyId || !projectId) {
      toast({ title: "Error de configuración", description: "No se pudo vincular tu empresa. Ve a Perfil de Empresa para configurarla.", variant: "destructive" });
      return;
    }
    const { data: tender, error } = await supabase.from("tenders").insert({
      title: title.trim(), company_id: companyId, project_id: projectId,
      contracting_entity: contractingEntity.trim() || null,
      contract_amount: contractAmount ? parseFloat(contractAmount) : null,
      duration: duration.trim() || null,
      submission_deadline: deadline || null,
      created_by: user?.id,
      sector: sector || null,
      garantia_provisional: garantiaProv ? parseFloat(garantiaProv) : null,
      garantia_definitiva: garantiaDef ? parseFloat(garantiaDef) : null,
      clasificacion_requerida: clasificacionReq || null,
      valor_estimado: valorEstimado ? parseFloat(valorEstimado) : null,
    }).select("id").single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setTenderId(tender.id);
    setUploadedDocsCount(0);
    setStep("upload");
  };

  const startAnalysis = async () => {
    if (!tenderId || !companyId || startingAnalysis) return;
    setStartingAnalysis(true);
    const { count: docsCount, error: docsError } = await supabase
      .from("tender_documents").select("id", { count: "exact", head: true }).eq("tender_id", tenderId);
    if (docsError || !docsCount || docsCount < 1) {
      toast({ title: "Sube al menos un PDF", description: "Necesitamos al menos un documento cargado para ejecutar el análisis.", variant: "destructive" });
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
      const { data, error } = await supabase.functions.invoke("analyze-tender", { body: { reportId: report.id } });
      if (error) throw error;
      setReportData(data.report_data);
      setStep("results");
      toast({ title: "¡Análisis completado!" });
    } catch (err: any) {
      toast({ title: "Error en el análisis", description: err.message, variant: "destructive" });
      setStep("upload");
    } finally {
      setStartingAnalysis(false);
    }
  };

  const sym = currencyOption.symbol;

  const steps = [
    { key: "info", label: "Datos", icon: FileText },
    { key: "upload", label: "Documentos", icon: FileText },
    { key: "analyzing", label: "Análisis IA", icon: Sparkles },
    { key: "results", label: "Resultados", icon: CheckCircle },
  ];
  const currentIdx = steps.findIndex(s => s.key === step);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-6">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${i <= currentIdx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                <s.icon size={14} /><span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i < currentIdx ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {step === "info" && (
          <Card>
            <CardHeader>
              <CardTitle>Datos de la Licitación</CardTitle>
              <CardDescription>Información del pliego. Los campos con * son obligatorios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Título *</Label><Input placeholder="Ej: Servicio de limpieza del Ayuntamiento" value={title} onChange={e => setTitle(e.target.value)} /></div>
              <div><Label>Entidad contratante</Label><Input placeholder="Ej: Ayuntamiento de Madrid" value={contractingEntity} onChange={e => setContractingEntity(e.target.value)} /></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Presupuesto base ({sym})</Label><CurrencyInput value={contractAmount} onChange={setContractAmount} /></div>
                <div><Label>Valor estimado ({sym})</Label><CurrencyInput value={valorEstimado} onChange={setValorEstimado} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Duración</Label><Input placeholder="Ej: 24 meses" value={duration} onChange={e => setDuration(e.target.value)} /></div>
                <div><Label>Fecha límite presentación</Label><Input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Garantía provisional ({sym})</Label><CurrencyInput value={garantiaProv} onChange={setGarantiaProv} /></div>
                <div><Label>Garantía definitiva ({sym})</Label><CurrencyInput value={garantiaDef} onChange={setGarantiaDef} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Clasificación requerida</Label><Input placeholder="Ej: Grupo C, Subgrupo 6" value={clasificacionReq} onChange={e => setClasificacionReq(e.target.value)} /></div>
                <div>
                  <Label>Sector (opcional, se detecta automáticamente)</Label>
                  <Select value={sector} onValueChange={setSector}>
                    <SelectTrigger><SelectValue placeholder="Auto-detectar" /></SelectTrigger>
                    <SelectContent>{SECTORES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              {projects.length > 1 && (
                <div>
                  <Label>Proyecto</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={createTender} className="w-full mt-2">Continuar a Documentos</Button>
            </CardContent>
          </Card>
        )}

        {step === "upload" && tenderId && (
          <Card>
            <CardHeader>
              <CardTitle>Subir Documentos del Pliego</CardTitle>
              <CardDescription>La IA analizará los PDFs con las 4 capas del motor estratégico.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <PdfUploader tenderId={tenderId} onUploadComplete={(docIds) => setUploadedDocsCount((prev) => prev + docIds.length)} />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("info")} className="flex-1">Atrás</Button>
                <Button onClick={startAnalysis} className="flex-1" disabled={startingAnalysis || uploadedDocsCount < 1}><Sparkles size={16} className="mr-2" />{startingAnalysis ? "Iniciando..." : "Iniciar Análisis 4 Capas"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "analyzing" && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="absolute inset-2 rounded-full bg-primary/30 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles size={32} className="text-primary animate-spin" style={{ animationDuration: "3s" }} />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Motor IA en acción...</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Ejecutando las 4 capas: Extracción → Clasificación Sectorial → Cruce con Empresa → Estrategia Competitiva.
                Calculando IAT, IRE y PEA. Esto puede tardar 1-3 minutos.
              </p>
            </CardContent>
          </Card>
        )}

        {step === "results" && reportData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-xl font-bold">Informe Estratégico</h2>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setShowSimulator(!showSimulator)}>
                  <Calculator size={16} className="mr-2" />{showSimulator ? "Ocultar Simulador" : "Simulador Económico"}
                </Button>
                {tenderId && (
                  <Link to={`/dashboard/technical-memory?tenderId=${tenderId}`}>
                    <Button variant="secondary" size="sm"><BookOpen size={16} className="mr-2" />Generar Memoria Técnica</Button>
                  </Link>
                )}
                <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>Volver al Dashboard</Button>
              </div>
            </div>
            {showSimulator && (
              <EconomicSimulator
                presupuestoBase={contractAmount ? parseFloat(contractAmount) : undefined}
                criteriosEconomicos={reportData.criterios_adjudicacion?.filter((c: any) => c.tipo === "automatico" && c.criterio?.toLowerCase().includes("econ")) || []}
              />
            )}
            <AnalysisReport data={reportData} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NewAnalysis;
