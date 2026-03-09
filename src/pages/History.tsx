import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Search, FileText, Calendar, Loader2, ExternalLink } from "lucide-react";

const History = () => {
  const { user } = useAuth();
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user.id).single();
      if (!profile?.company_id) { setLoading(false); return; }

      const { data } = await supabase
        .from("tenders")
        .select("id, title, contracting_entity, contract_amount, sector, status, created_at, submission_deadline")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false });

      setTenders(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

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
      default: return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

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
              <Link key={t.id} to={`/dashboard/report/${t.id}`} className="block">
                <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
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
                    <div className="text-right shrink-0">
                      {t.contract_amount && (
                        <p className="font-semibold text-primary">{Number(t.contract_amount).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</p>
                      )}
                      <ExternalLink size={14} className="text-muted-foreground ml-auto mt-2" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default History;
