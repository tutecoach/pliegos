import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import AnalysisReport from "@/components/tender/AnalysisReport";
import EconomicSimulator from "@/components/tender/EconomicSimulator";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Loader2, ArrowLeft, BookOpen, Calculator, Download, FileText as FileTextIcon, RefreshCw } from "lucide-react";
import { exportReportAsWord, exportReportAsPdf } from "@/lib/report-export";
import { toast } from "@/hooks/use-toast";

const ReportView = () => {
  const { user } = useAuth();
  const { tenderId } = useParams<{ tenderId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tender, setTender] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  const loadData = async () => {
    if (!user || !tenderId) return;
    const [tenderRes, reportRes] = await Promise.all([
      supabase.from("tenders").select("*").eq("id", tenderId).single(),
      supabase.from("analysis_reports").select("id, report_data, status").eq("tender_id", tenderId).eq("status", "completed").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    setTender(tenderRes.data);
    setReportData(reportRes.data?.report_data || null);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user, tenderId]);

  const handleReanalyze = async () => {
    if (!user || !tenderId || !tender) return;
    setReanalyzing(true);
    try {
      const { data: existing } = await supabase
        .from("analysis_reports")
        .select("id")
        .eq("tender_id", tenderId)
        .order("created_at", { ascending: false })
        .limit(1);

      let reportId: string;
      if (existing && existing.length > 0) {
        reportId = existing[0].id;
        await supabase.from("analysis_reports").update({ status: "processing", report_data: null } as any).eq("id", reportId);
      } else {
        const { data: newReport, error } = await supabase.from("analysis_reports").insert({
          tender_id: tenderId,
          company_id: tender.company_id,
          created_by: user.id,
          status: "processing",
        }).select("id").single();
        if (error) throw error;
        reportId = newReport.id;
      }

      await supabase.from("tenders").update({ status: "processing" }).eq("id", tenderId);

      const { error } = await supabase.functions.invoke("analyze-tender", { body: { reportId } });
      if (error) throw error;

      toast({ title: "Re-análisis iniciado", description: "El análisis integral se está procesando con todos los documentos." });
      await loadData();
    } catch (err: any) {
      toast({ title: "Error al re-analizar", description: err.message, variant: "destructive" });
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading) return (
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
            <Button variant="outline" size="sm" onClick={handleReanalyze} disabled={reanalyzing}>
              {reanalyzing ? <Loader2 size={16} className="mr-2 animate-spin" /> : <RefreshCw size={16} className="mr-2" />}
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
