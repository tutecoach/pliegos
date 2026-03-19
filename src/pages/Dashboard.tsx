import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { FolderOpen, FileText, BarChart3, Sparkles, Building2, Clock, Calendar, ArrowRightLeft, Loader2 } from "lucide-react";
import { useProfileQuery, useUserCompaniesQuery, useSwitchCompanyMutation } from "@/hooks/queries/useCompanyQueries";
import { useDashboardQuery } from "@/hooks/queries/useTendersQueries";

/**
 * Dashboard — Reescrito con React Query.
 * 
 * ANTES: 183 líneas con múltiples useState, useEffect anidados y funciones de fetch manuales.
 * AHORA: ~110 líneas. Sin useEffect. Caché de 1 minuto en los datos del dashboard.
 */
const Dashboard = () => {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();

  // React Query: perfil del usuario
  const { data: profile, isLoading: profileLoading } = useProfileQuery(user?.id);
  const companyId = profile?.company_id ?? null;

  // React Query: datos del dashboard (company name, stats, recent tenders)
  const { data: dashData, isLoading: dashLoading } = useDashboardQuery(companyId);

  // React Query: empresas del usuario (para enterprise multi-company)
  const { data: allCompanies = [] } = useUserCompaniesQuery(user?.id);

  // Mutation: cambiar empresa activa
  const switchCompanyMutation = useSwitchCompanyMutation(user?.id);

  const isLoading = profileLoading || dashLoading;
  const isEnterprise = profile?.plan_tier === "enterprise";
  const showCompanySelector = isEnterprise && allCompanies.length > 1;

  const stats = dashData?.stats ?? { projects: 0, tenders: 0, reports: 0 };
  const recentTenders = dashData?.recentTenders ?? [];
  const companyName = dashData?.companyName ?? "";

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">Bienvenido, {profile?.full_name || "Usuario"}</h2>
            <p className="text-muted-foreground">
              {companyName || "Configura tu perfil de empresa para activar el matching inteligente."}
            </p>
          </div>

          {showCompanySelector && (
            <Select
              value={companyId || ""}
              onValueChange={(id) => switchCompanyMutation.mutate(id)}
              disabled={switchCompanyMutation.isPending}
            >
              <SelectTrigger className="w-[260px]">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft size={14} className="text-primary" />
                  <SelectValue placeholder="Seleccionar empresa" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {allCompanies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2"><Building2 size={14} /> {c.name}</div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : (
          <>
            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              {[
                { label: "Proyectos", value: stats.projects, icon: FolderOpen, color: "text-accent" },
                { label: "Licitaciones", value: stats.tenders, icon: FileText, color: "text-primary" },
                { label: "Informes", value: stats.reports, icon: BarChart3, color: "text-accent" },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">{s.label}</span>
                    <s.icon size={20} className={s.color} />
                  </div>
                  <p className="text-3xl font-bold">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <Link to="/dashboard/new-analysis" className="block">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 hover:bg-primary/10 transition-colors">
                  <Sparkles size={24} className="text-primary mb-3" />
                  <h3 className="font-semibold mb-1">Nuevo Análisis con IA</h3>
                  <p className="text-sm text-muted-foreground">Sube un pliego y obtén análisis estratégico con scoring IAT/IRE/PEA</p>
                </div>
              </Link>
              <Link to="/dashboard/company" className="block">
                <div className="bg-accent/5 border border-accent/20 rounded-xl p-6 hover:bg-accent/10 transition-colors">
                  <Building2 size={24} className="text-accent mb-3" />
                  <h3 className="font-semibold mb-1">Perfil de Empresa</h3>
                  <p className="text-sm text-muted-foreground">Configura datos financieros, certificaciones y equipo para matching</p>
                </div>
              </Link>
            </div>

            {/* Licitaciones recientes */}
            {recentTenders.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2"><Clock size={18} className="text-primary" />Licitaciones Recientes</h3>
                  <Link to="/dashboard/history"><Button variant="ghost" size="sm">Ver todas</Button></Link>
                </div>
                <div className="space-y-3">
                  {recentTenders.map((t: Record<string, unknown>) => (
                    <Link key={t.id as string} to={`/dashboard/report/${t.id as string}`} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.title as string}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {t.sector && <Badge variant="outline" className="text-xs">{t.sector as string}</Badge>}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar size={10} />{new Date(t.created_at as string).toLocaleDateString("es-ES")}
                          </span>
                        </div>
                      </div>
                      {t.contract_amount && (
                        <span className="text-sm font-medium text-primary shrink-0">{formatCurrency(Number(t.contract_amount))}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {stats.tenders === 0 && (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Comienza tu primer análisis</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">Configura tu empresa y luego analiza tu primer pliego con las 4 capas de IA.</p>
                <div className="flex justify-center gap-3">
                  <Link to="/dashboard/company"><Button variant="outline"><Building2 size={16} className="mr-2" />Configurar Empresa</Button></Link>
                  <Link to="/dashboard/new-analysis"><Button><Sparkles size={16} className="mr-2" />Nuevo Análisis</Button></Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
