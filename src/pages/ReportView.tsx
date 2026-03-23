import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import AnalysisReport from "@/components/tender/AnalysisReport";
import EconomicSimulator from "@/components/tender/EconomicSimulator";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Loader2, ArrowLeft, BookOpen, Calculator, Download, FileText as FileTextIcon, RefreshCw } from "lucide-react";
import { exportReportAsWord, exportReportAsPdf } from "@/lib/report-export";
import { toast } from "@/hooks/use-toast";
import { useReportViewQuery, useReanalyzeMutation } from "@/hooks/queries/useReportQuery";

/**
 * ReportView — Migrado a React Query.
 *
 * ANTES: useState + useEffect + loadData() manual + handleReanalyze duplicado.
 * AHORA: useReportViewQuery + useReanalyzeMutation consolidado. Sin useEffect.
 */
const ReportView = () => {
  const { user } = useAuth();
  const { tenderId } = useParams<{ tenderId: string }>();
  const navigate = useNavigate();
  const [showSimulator, setShowSimulator] = useState(false);

  const { data, isLoading, refetch } = useReportViewQuery(tenderId);
  const reanalyzeMutation = useReanalyzeMutation(() => refetch());

  const tender = data?.tender ?? null;
  const reportData = data?.reportData ?? null;

  const handleReanalyze = () => {
    if (!tenderId || !tender || !user) return;
    reanalyzeMutation.mutate({
      tenderId,
      companyId: tender.company_id,
      userId: user.id,
    });
  };

  if (isLoading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>
    </DashboardLayout>
  );

  if (!tender) return (
    <DashboardLayout>
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Licitación no encontrada</h2>
        <Button onClick={() => navigate("/dashboard/history")}>Volver al historial</Button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft size={20} /></Button>
            {reportData && (
              <>
                <Button variant="outline" size="sm" onClick={() => exportReportAsWord(reportData, tender.title)}>
                  <FileTextIcon size={16} className="mr-2" />Word
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  const ok = exportReportAsPdf(reportData, tender.title);
                  if (!ok) toast({ title: "Permite ventanas emergentes para exportar PDF", variant: "destructive" });
                }}>
                  <Download size={16} className="mr-2" />PDF
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleReanalyze} disabled={reanalyzeMutation.isPending}>
              {reanalyzeMutation.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <RefreshCw size={16} className="mr-2" />}
              Re-analizar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSimulator(!showSimulator)}>
              <Calculator size={16} className="mr-2" />Simulador
            </Button>
            <Link to={`/dashboard/technical-memory?tenderId=${tenderId}`}>
              <Button variant="secondary" size="sm"><BookOpen size={16} className="mr-2" />Memoria Técnica</Button>
            </Link>
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight break-words">{tender.title}</h1>
            <p className="text-sm text-muted-foreground">{tender.contracting_entity || "Sin entidad"}</p>
          </div>
        </div>

        {showSimulator && (
          <div className="mb-6">
            <EconomicSimulator presupuestoBase={tender.contract_amount ? Number(tender.contract_amount) : undefined} />
          </div>
        )}

        {reportData ? (
          <AnalysisReport data={reportData} />
        ) : (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <p className="text-muted-foreground">No hay informe disponible para esta licitación.</p>
            <Link to="/dashboard/new-analysis"><Button className="mt-4">Crear nuevo análisis</Button></Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReportView;
