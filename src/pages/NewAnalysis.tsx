import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import Logo from "@/components/landing/Logo";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  FileText,
  CheckCircle,
} from "lucide-react";

type Step = "info" | "upload" | "analyzing" | "results";

const NewAnalysis = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("info");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [contractingEntity, setContractingEntity] = useState("");
  const [contractAmount, setContractAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [deadline, setDeadline] = useState("");
  const [projectId, setProjectId] = useState("");

  // Analysis state
  const [tenderId, setTenderId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (profile?.company_id) {
        setCompanyId(profile.company_id);

        // If no projects, create a default one
        const { data: projs } = await supabase
          .from("projects")
          .select("id, name")
          .eq("company_id", profile.company_id);

        if (projs && projs.length > 0) {
          setProjects(projs);
          setProjectId(projs[0].id);
        } else {
          // Create default project
          const { data: newProj } = await supabase
            .from("projects")
            .insert({ name: "Proyecto General", company_id: profile.company_id })
            .select("id, name")
            .single();
          if (newProj) {
            setProjects([newProj]);
            setProjectId(newProj.id);
          }
        }
      }
    };
    load();
  }, [user]);

  const createTender = async () => {
    if (!title.trim()) {
      toast({ title: "El título es obligatorio", variant: "destructive" });
      return;
    }
    if (!companyId || !projectId) {
      toast({ title: "Error de configuración", variant: "destructive" });
      return;
    }

    const { data: tender, error } = await supabase
      .from("tenders")
      .insert({
        title: title.trim(),
        company_id: companyId,
        project_id: projectId,
        contracting_entity: contractingEntity.trim() || null,
        contract_amount: contractAmount ? parseFloat(contractAmount) : null,
        duration: duration.trim() || null,
        submission_deadline: deadline || null,
        created_by: user?.id,
      })
      .select("id")
      .single();

    if (error) {
      toast({ title: "Error creando licitación", description: error.message, variant: "destructive" });
      return;
    }

    setTenderId(tender.id);
    setStep("upload");
  };

  const handleUploadComplete = () => {
    // Files uploaded, ready to analyze
  };

  const startAnalysis = async () => {
    if (!tenderId || !companyId) return;
    setStep("analyzing");

    // Create analysis report
    const { data: report, error: reportError } = await supabase
      .from("analysis_reports")
      .insert({
        tender_id: tenderId,
        company_id: companyId,
        created_by: user?.id,
        status: "processing",
      })
      .select("id")
      .single();

    if (reportError) {
      toast({ title: "Error iniciando análisis", description: reportError.message, variant: "destructive" });
      setStep("upload");
      return;
    }

    setReportId(report.id);

    // Call edge function
    try {
      const { data, error } = await supabase.functions.invoke("analyze-tender", {
        body: { reportId: report.id },
      });

      if (error) throw error;

      setReportData(data.report_data);
      setStep("results");
      toast({ title: "¡Análisis completado!", description: "El informe ha sido generado exitosamente." });
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast({
        title: "Error en el análisis",
        description: err.message || "Inténtalo de nuevo más tarde",
        variant: "destructive",
      });
      setStep("upload");
    }
  };

  const steps = [
    { key: "info", label: "Datos", icon: FileText },
    { key: "upload", label: "Documentos", icon: FileText },
    { key: "analyzing", label: "Análisis IA", icon: Sparkles },
    { key: "results", label: "Resultados", icon: CheckCircle },
  ];
  const currentIdx = steps.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={20} />
        </Button>
        <Link to="/dashboard">
          <Logo size="sm" />
        </Link>
        <h1 className="text-lg font-bold ml-2">Nuevo Análisis de Pliego</h1>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  i <= currentIdx
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <s.icon size={14} />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${i < currentIdx ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Tender Info */}
        {step === "info" && (
          <Card>
            <CardHeader>
              <CardTitle>Datos de la Licitación</CardTitle>
              <CardDescription>
                Introduce la información básica del pliego que quieres analizar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título de la licitación *</Label>
                <Input
                  id="title"
                  placeholder="Ej: Servicio de limpieza del Ayuntamiento de Madrid"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="entity">Entidad contratante</Label>
                <Input
                  id="entity"
                  placeholder="Ej: Ayuntamiento de Madrid"
                  value={contractingEntity}
                  onChange={(e) => setContractingEntity(e.target.value)}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Importe estimado (€)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Ej: 500000"
                    value={contractAmount}
                    onChange={(e) => setContractAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duración</Label>
                  <Input
                    id="duration"
                    placeholder="Ej: 24 meses"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deadline">Fecha límite de presentación</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
                {projects.length > 1 && (
                  <div>
                    <Label>Proyecto</Label>
                    <Select value={projectId} onValueChange={setProjectId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Button onClick={createTender} className="w-full mt-2">
                Continuar a Documentos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Upload */}
        {step === "upload" && tenderId && (
          <Card>
            <CardHeader>
              <CardTitle>Subir Documentos del Pliego</CardTitle>
              <CardDescription>
                Sube los PDFs del pliego de condiciones. La IA los analizará para extraer requisitos,
                criterios y riesgos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <PdfUploader tenderId={tenderId} onUploadComplete={handleUploadComplete} />

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("info")} className="flex-1">
                  Atrás
                </Button>
                <Button onClick={startAnalysis} className="flex-1">
                  <Sparkles size={16} className="mr-2" />
                  Iniciar Análisis con IA
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Analyzing */}
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
              <h3 className="text-xl font-bold mb-2">Analizando el pliego...</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Nuestra IA está leyendo los documentos, extrayendo requisitos técnicos, criterios de
                adjudicación, solvencia exigida y evaluando riesgos. Esto puede tardar 1-2 minutos.
              </p>
              <div className="flex justify-center gap-1 mt-6">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Results */}
        {step === "results" && reportData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Informe de Análisis</h2>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Volver al Dashboard
              </Button>
            </div>
            <AnalysisReport data={reportData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default NewAnalysis;
