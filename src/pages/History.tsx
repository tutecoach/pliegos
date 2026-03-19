import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
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
import { Search, FileText, Calendar, Loader2, RotateCcw, Trash2, BookOpen, BarChart3, Pencil } from "lucide-react";
import TenderEditDialog from "@/components/tender/TenderEditDialog";
import { useProfileQuery } from "@/hooks/queries/useCompanyQueries";
import { useTendersQuery, useDeleteTenderMutation, useRetryAnalysisMutation } from "@/hooks/queries/useTendersQueries";

/**
 * History — Reescrito con React Query.
 * 
 * ANTES: 284 líneas, useEffect + useState + loadTenders() manual.
 * AHORA: ~120 líneas. Sin useEffect, sin loadTenders(): la caché se invalida
 *         automáticamente en delete y retry mutations.
 */
const History = () => {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();

  // Filtros de UI (estado local puro, no servidor)
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [editingTenderId, setEditingTenderId] = useState<string | null>(null);

  // React Query: perfil → company_id
  const { data: profile } = useProfileQuery(user?.id);
  const companyId = profile?.company_id ?? null;

  // React Query: licitaciones + mapa de memorias
  const { data, isLoading, refetch } = useTendersQuery(companyId);
  const tenders = data?.tenders ?? [];
  const memoriesMap = data?.memoriesMap ?? {};

  // Mutations
  const deleteMutation = useDeleteTenderMutation(companyId);
  const retryMutation = useRetryAnalysisMutation(companyId, user?.id);

  const sectors = [...new Set(tenders.map((t) => t.sector).filter(Boolean))];

  const filtered = tenders.filter((t) => {
    const matchSearch = !search
      || t.title?.toLowerCase().includes(search.toLowerCase())
      || t.contracting_entity?.toLowerCase().includes(search.toLowerCase());
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

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(
      { tenderId: deleteTarget.id, title: deleteTarget.title },
      { onSettled: () => setDeleteTarget(null) }
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Historial de Licitaciones</h1>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por título o entidad..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={sectorFilter} onValueChange={setSectorFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Todos los sectores" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los sectores</SelectItem>
              {sectors.map((s) => <SelectItem key={s} value={s!}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
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
            {filtered.map((t) => (
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
                    {t.status === "completed" && (
                      <Link to={`/dashboard/report/${t.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" title="Ver informe de análisis">
                          <BarChart3 size={14} className="mr-1" />Informe
                        </Button>
                      </Link>
                    )}
                    <Link to={`/dashboard/technical-memory?tenderId=${t.id}`} onClick={(e) => e.stopPropagation()}>
                      <Button variant={memoriesMap[t.id] ? "outline" : "secondary"} size="sm">
                        <BookOpen size={14} className="mr-1" />
                        {memoriesMap[t.id] ? "Memoria" : "Generar Memoria"}
                      </Button>
                    </Link>
                    {(t.status === "pending" || t.status === "error") && (
                      <Button
                        variant="outline" size="icon" title="Reintentar análisis"
                        disabled={retryMutation.isPending && retryMutation.variables === t.id}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); retryMutation.mutate(t.id); }}
                      >
                        {retryMutation.isPending && retryMutation.variables === t.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <RotateCcw size={14} />}
                      </Button>
                    )}
                    <Button
                      variant="outline" size="icon" title="Editar datos y documentos"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingTenderId(t.id); }}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="outline" size="icon" title="Eliminar licitación"
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
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TenderEditDialog
        tenderId={editingTenderId}
        open={!!editingTenderId}
        onOpenChange={(open) => { if (!open) setEditingTenderId(null); }}
        onSaved={() => { setEditingTenderId(null); refetch(); }}
      />
    </DashboardLayout>
  );
};

export default History;
