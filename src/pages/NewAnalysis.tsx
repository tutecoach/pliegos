import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PdfUploader from "@/components/tender/PdfUploader";
import AnalysisReport from "@/components/tender/AnalysisReport";
import EconomicSimulator from "@/components/tender/EconomicSimulator";
import TenderInfoForm from "@/components/tender/TenderInfoForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Sparkles, FileText, CheckCircle, BookOpen, Calculator } from "lucide-react";
import { useNewAnalysis } from "@/hooks/useNewAnalysis";

const STEPS = [
  { key: "info", label: "Datos", icon: FileText },
  { key: "upload", label: "Documentos", icon: FileText },
  { key: "analyzing", label: "Análisis IA", icon: Sparkles },
  { key: "results", label: "Resultados", icon: CheckCircle },
] as const;

/**
 * NewAnalysis — Orquestador.
 * 
 * ANTES: 341 líneas, estado+lógica+UI mezclados.
 * AHORA FASE 4: El paso "info" usa TenderInfoForm (react-hook-form+Zod).
 *   - Validación antes de submit
 *   - Sin validateación manual en createTender
 */
const NewAnalysis = () => {
  const {
    step, setStep, loading,
    planTier, companyId, allCompanies, projects, defaultProjectId,
    tenderId, reportData, lastFormData,
    showSimulator, setShowSimulator,
    uploadedDocsCount, setUploadedDocsCount,
    startingAnalysis, currencySymbol,
    handleCompanySwitch, createTender, startAnalysis, navigateToDashboard,
  } = useNewAnalysis();

  const currentIdx = STEPS.findIndex((s) => s.key === step);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-6">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${i <= currentIdx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                <s.icon size={14} /><span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${i < currentIdx ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {/* Step: info — TenderInfoForm con react-hook-form + Zod */}
        {step === "info" && (
          <TenderInfoForm
            defaultValues={{
              title: "", contractingEntity: "", contractAmount: "",
              valorEstimado: "", duration: "", deadline: "",
              garantiaProv: "", garantiaDef: "", clasificacionReq: "",
              sector: "", projectId: defaultProjectId,
            }}
            projects={projects}
            allCompanies={allCompanies}
            companyId={companyId}
            planTier={planTier}
            currencySymbol={currencySymbol}
            onSubmit={createTender}
            onCompanySwitch={handleCompanySwitch}
          />
        )}

        {/* Step: upload */}
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
                <Button onClick={startAnalysis} className="flex-1" disabled={startingAnalysis || uploadedDocsCount < 1}>
                  <Sparkles size={16} className="mr-2" />{startingAnalysis ? "Iniciando..." : "Iniciar Análisis 4 Capas"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: analyzing */}
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

        {/* Step: results */}
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
                <Button variant="outline" size="sm" onClick={navigateToDashboard}>Volver al Dashboard</Button>
              </div>
            </div>
            {showSimulator && (
              <EconomicSimulator
                presupuestoBase={lastFormData?.contractAmount ? parseFloat(lastFormData.contractAmount) : undefined}
                criteriosEconomicos={(reportData as Record<string, unknown[]>).criterios_adjudicacion?.filter((c: unknown) => {
                  const crit = c as Record<string, unknown>;
                  return crit.tipo === "automatico" && (crit.criterio as string)?.toLowerCase().includes("econ");
                }) || []}
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
