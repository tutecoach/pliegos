import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import AnalysisReport from "@/components/tender/AnalysisReport";
import EconomicSimulator from "@/components/tender/EconomicSimulator";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Loader2, ArrowLeft, BookOpen, Calculator, Download } from "lucide-react";

const ReportView = () => {
  const { user } = useAuth();
  const { tenderId } = useParams<{ tenderId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tender, setTender] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [showSimulator, setShowSimulator] = useState(false);

  useEffect(() => {
    if (!user || !tenderId) return;
    const load = async () => {
      const [tenderRes, reportRes] = await Promise.all([
        supabase.from("tenders").select("*").eq("id", tenderId).single(),
        supabase.from("analysis_reports").select("report_data, status").eq("tender_id", tenderId).eq("status", "completed").order("created_at", { ascending: false }).limit(1).single(),
      ]);
      setTender(tenderRes.data);
      setReportData(reportRes.data?.report_data);
      setLoading(false);
    };
    load();
  }, [user, tenderId]);

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
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft size={20} /></Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{tender.title}</h1>
            <p className="text-sm text-muted-foreground">{tender.contracting_entity || "Sin entidad"}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowSimulator(!showSimulator)}>
              <Calculator size={16} className="mr-2" />Simulador
            </Button>
            <Link to={`/dashboard/technical-memory?tenderId=${tenderId}`}>
              <Button variant="secondary" size="sm"><BookOpen size={16} className="mr-2" />Memoria Técnica</Button>
            </Link>
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
