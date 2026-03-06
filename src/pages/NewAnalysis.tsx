import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PdfUploader from "@/components/tender/PdfUploader";
import AnalysisReport from "@/components/tender/AnalysisReport";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, Loader2, Sparkles, FileText, CheckCircle, BookOpen } from "lucide-react";

type Step = "info" | "upload" | "analyzing" | "results";

const NewAnalysis = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("info");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

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

  const SECTORES = [
    "Obras Civiles", "Energía", "Agua y Saneamiento", "Tecnología",
    "Sanidad", "Servicios Generales", "Industrial", "Transporte",
    "Telecomunicaciones", "Ambiental", "Arquitectura", "Facility Management",
  ];

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user.id).single();
      if (profile?.company_id) {
        setCompanyId(profile.company_id);
        const { data: projs } = await supabase.from("projects").select("id, name").eq("company_id", profile.company_id);
        if (projs && projs.length > 0) {
          setProjects(projs);
          setProjectId(projs[0].id);
        } else {
          const { data: newProj } = await supabase.from("projects").insert({ name: "Proyecto General", company_id: profile.company_id }).select("id, name").single();
          if (newProj) { setProjects([newProj]); setProjectId(newProj.id); }
        }
      }
    };
    load();
  }, [user]);

  const createTender = async () => {
    if (!title.trim()) { toast({ title: "El título es obligatorio", variant: "destructive" }); return; }
    if (!companyId || !projectId) { toast({ title: "Error de configuración", variant: "destructive" }); return; }

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
    setStep("upload");
  };

  const startAnalysis = async () => {
    if (!tenderId || !companyId) return;
    setStep("analyzing");

    const { data: report, error: reportError } = await supabase.from("analysis_reports")
      .insert({ tender_id: tenderId, company_id: companyId, created_by: user?.id, status: "processing" })
      .select("id").single();

    if (reportError) { toast({ title: "Error", description: reportError.message, variant: "destructive" }); setStep("upload"); return; }

    try {
      const { data, error } = await supabase.functions.invoke("analyze-tender", { body: { reportId: report.id } });
      if (error) throw error;
      setReportData(data.report_data);
      setStep("results");
      toast({ title: "¡Análisis completado!" });
    } catch (err: any) {
      toast({ title: "Error en el análisis", description: err.message, variant: "destructive" });
      setStep("upload");
    }
  };

  const steps = [
    { key: "info", label: "Datos", icon: FileText },
    { key: "upload", label: "Documentos", icon: FileText },
    { key: "analyzing", label: "Análisis IA", icon: Sparkles },
    { key: "results", label: "Resultados", icon: CheckCircle },
  ];
  const currentIdx = steps.findIndex(s => s.key === step);

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

        {/* Step 1 */}
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
                <div><Label>Presupuesto base (€)</Label><Input type="number" value={contractAmount} onChange={e => setContractAmount(e.target.value)} /></div>
                <div><Label>Valor estimado (€)</Label><Input type="number" value={valorEstimado} onChange={e => setValorEstimado(e.target.value)} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Duración</Label><Input placeholder="Ej: 24 meses" value={duration} onChange={e => setDuration(e.target.value)} /></div>
                <div><Label>Fecha límite presentación</Label><Input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Garantía provisional (€)</Label><Input type="number" value={garantiaProv} onChange={e => setGarantiaProv(e.target.value)} /></div>
                <div><Label>Garantía definitiva (€)</Label><Input type="number" value={garantiaDef} onChange={e => setGarantiaDef(e.target.value)} /></div>
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

        {/* Step 2 */}
        {step === "upload" && tenderId && (
          <Card>
            <CardHeader>
              <CardTitle>Subir Documentos del Pliego</CardTitle>
              <CardDescription>La IA analizará los PDFs con las 4 capas del motor estratégico.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <PdfUploader tenderId={tenderId} onUploadComplete={() => {}} />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("info")} className="flex-1">Atrás</Button>
                <Button onClick={startAnalysis} className="flex-1"><Sparkles size={16} className="mr-2" />Iniciar Análisis 4 Capas</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3 */}
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

        {/* Step 4 */}
        {step === "results" && reportData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-xl font-bold">Informe Estratégico</h2>
              <div className="flex gap-2">
                {tenderId && (
                  <Link to={`/dashboard/technical-memory?tenderId=${tenderId}`}>
                    <Button variant="secondary"><BookOpen size={16} className="mr-2" />Generar Memoria Técnica</Button>
                  </Link>
                )}
                <Button variant="outline" onClick={() => navigate("/dashboard")}>Volver al Dashboard</Button>
              </div>
            </div>
            <AnalysisReport data={reportData} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NewAnalysis;
