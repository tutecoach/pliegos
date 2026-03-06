import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  FolderOpen, FileText, BarChart3, Sparkles, Building2,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string; company_id: string | null } | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [stats, setStats] = useState({ projects: 0, tenders: 0, reports: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: p } = await supabase.from("profiles").select("full_name, company_id").eq("user_id", user.id).single();
      setProfile(p);
      if (p?.company_id) {
        const { data: c } = await supabase.from("companies").select("name").eq("id", p.company_id).single();
        if (c) setCompanyName(c.name);
        const [projectsRes, tendersRes, reportsRes] = await Promise.all([
          supabase.from("projects").select("id", { count: "exact", head: true }).eq("company_id", p.company_id),
          supabase.from("tenders").select("id", { count: "exact", head: true }).eq("company_id", p.company_id),
          supabase.from("analysis_reports").select("id", { count: "exact", head: true }).eq("company_id", p.company_id),
        ]);
        setStats({ projects: projectsRes.count ?? 0, tenders: tendersRes.count ?? 0, reports: reportsRes.count ?? 0 });
      }
    };
    fetchData();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-1">Bienvenido, {profile?.full_name || "Usuario"}</h2>
          <p className="text-muted-foreground">{companyName || "Configura tu perfil de empresa para activar el matching inteligente."}</p>
        </div>

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
              <p className="text-sm text-muted-foreground">Sube un pliego y obtén un análisis estratégico con scoring IAT/IRE/PEA</p>
            </div>
          </Link>
          <Link to="/dashboard/company" className="block">
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-6 hover:bg-accent/10 transition-colors">
              <Building2 size={24} className="text-accent mb-3" />
              <h3 className="font-semibold mb-1">Perfil de Empresa</h3>
              <p className="text-sm text-muted-foreground">Configura datos financieros, certificaciones y equipo para matching automático</p>
            </div>
          </Link>
        </div>

        {stats.projects === 0 && stats.tenders === 0 && (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Comienza tu primer análisis</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Configura tu empresa y luego analiza tu primer pliego con las 4 capas de IA.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/dashboard/company"><Button variant="outline"><Building2 size={16} className="mr-2" />Configurar Empresa</Button></Link>
              <Link to="/dashboard/new-analysis"><Button><Sparkles size={16} className="mr-2" />Nuevo Análisis</Button></Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
