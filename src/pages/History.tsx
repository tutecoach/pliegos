import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { toast } from "@/hooks/use-toast";
import { Search, FileText, Calendar, Loader2, ExternalLink, RotateCcw, Trash2, BookOpen, BarChart3, Pencil } from "lucide-react";
import TenderEditDialog from "@/components/tender/TenderEditDialog";

const History = () => {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [tenders, setTenders] = useState<any[]>([]);
  const [memoriesMap, setMemoriesMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [retrying, setRetrying] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [editingTenderId, setEditingTenderId] = useState<string | null>(null);

  const loadTenders = async () => {
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user.id).single();
    if (!profile?.company_id) { setLoading(false); return; }
    setCompanyId(profile.company_id);

    const [tendersRes, memoriesRes] = await Promise.all([
      supabase
        .from("tenders")
        .select("id, title, contracting_entity, contract_amount, sector, status, created_at, submission_deadline")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false }),
      supabase
        .from("technical_memories")
        .select("tender_id")
        .eq("company_id", profile.company_id),
    ]);

    setTenders(tendersRes.data || []);
    
    const memMap: Record<string, boolean> = {};
    (memoriesRes.data || []).forEach((m: any) => { memMap[m.tender_id] = true; });
    setMemoriesMap(memMap);
    setLoading(false);
  };

  useEffect(() => { loadTenders(); }, [user]);

  const handleRetry = async (e: React.MouseEvent, tenderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setRetrying(tenderId);
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
          company_id: companyId!,
          created_by: user!.id,
          status: "processing",
        }).select("id").single();
        if (error) throw error;
        reportId = newReport.id;
      }

      await supabase.from("tenders").update({ status: "processing" }).eq("id", tenderId);

      const { error } = await supabase.functions.invoke("analyze-tender", { body: { reportId } });
      if (error) throw error;

      toast({ title: "Análisis reiniciado", description: "El análisis se ha relanzado correctamente." });
      await loadTenders();
    } catch (err: any) {
      toast({ title: "Error al reintentar", description: err.message, variant: "destructive" });
    } finally {
      setRetrying(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await supabase.from("tenders").update({ deleted_at: new Date().toISOString() }).eq("id", deleteTarget.id);
      setTenders(prev => prev.filter(t => t.id !== deleteTarget.id));
      toast({ title: "Licitación eliminada", description: `"${deleteTarget.title}" ha sido eliminada.` });
    } catch (err: any) {
      toast({ title: "Error al eliminar", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const sectors = [...new Set(tenders.map(t => t.sector).filter(Boolean))];

  const filtered = tenders.filter(t => {
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.contracting_entity?.toLowerCase().includes(search.toLowerCase());
    const matchSector = sectorFilter === "all" || t.sector === sectorFilter;
    return matchSearch && matchSector;
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case "processing": return <Badge className="bg-yellow-100 text-yellow-800">Procesando</Badge>;
      case "error": return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  const canRetry = (status: string) => status === "pending" || status === "error";
  const hasMemory = (tenderId: string) => memoriesMap[tenderId] === true;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Historial de Licitaciones</h1>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por título o entidad..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={sectorFilter} onValueChange={setSectorFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Todos los sectores" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los sectores</SelectItem>
              {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Sin licitaciones</h3>
            <p className="text-muted-foreground mb-4">No se encontraron licitaciones con los filtros aplicados.</p>
            <Link to="/dashboard/new-analysis"><Button>Nuevo Análisis</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(t => (
              <div key={t.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{t.title}</h3>
                    <p className="text-sm text-muted-foreground">{t.contracting_entity || "Sin entidad"}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {t.sector && <Badge variant="outline" className="text-xs">{t.sector}</Badge>}
                      {statusBadge(t.status)}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar size={12} />{new Date(t.created_at).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {t.contract_amount && (
                      <p className="font-semibold text-primary mr-2">{formatCurrency(Number(t.contract_amount))}</p>
                    )}

                    {/* Informe de análisis */}
                    {t.status === "completed" && (
                      <Link to={`/dashboard/report/${t.id}`} onClick={e => e.stopPropagation()}>
                        <Button variant="outline" size="sm" title="Ver informe de análisis">
                          <BarChart3 size={14} className="mr-1" />Informe
                        </Button>
                      </Link>
                    )}

                    {/* Memoria técnica */}
                    <Link to={`/dashboard/technical-memory?tenderId=${t.id}`} onClick={e => e.stopPropagation()}>
                      <Button
                        variant={hasMemory(t.id) ? "outline" : "secondary"}
                        size="sm"
                        title={hasMemory(t.id) ? "Ver / Regenerar memoria técnica" : "Generar memoria técnica"}
                      >
                        <BookOpen size={14} className="mr-1" />
                        {hasMemory(t.id) ? "Memoria" : "Generar Memoria"}
                      </Button>
                    </Link>

                    {canRetry(t.status) && (
                      <Button
                        variant="outline"
                        size="icon"
                        title="Reintentar análisis"
                        disabled={retrying === t.id}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRetry(e, t.id); }}
                      >
                        {retrying === t.id ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      title="Eliminar licitación"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget({ id: t.id, title: t.title }); }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar licitación?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>"{deleteTarget?.title}"</strong> y todos sus datos asociados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default History;
