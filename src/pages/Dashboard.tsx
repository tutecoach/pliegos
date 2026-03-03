import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import Logo from "@/components/landing/Logo";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: FolderOpen, label: "Proyectos", href: "/dashboard/projects" },
  { icon: FileText, label: "Licitaciones", href: "/dashboard/tenders" },
  { icon: BarChart3, label: "Informes", href: "/dashboard/reports" },
  { icon: Settings, label: "Configuración", href: "/dashboard/settings" },
];

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string; company_id: string | null } | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [stats, setStats] = useState({ projects: 0, tenders: 0, reports: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch profile
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, company_id")
        .eq("user_id", user.id)
        .single();
      setProfile(p);

      if (p?.company_id) {
        const { data: c } = await supabase
          .from("companies")
          .select("name")
          .eq("id", p.company_id)
          .single();
        if (c) setCompanyName(c.name);

        // Fetch counts
        const [projectsRes, tendersRes, reportsRes] = await Promise.all([
          supabase.from("projects").select("id", { count: "exact", head: true }).eq("company_id", p.company_id),
          supabase.from("tenders").select("id", { count: "exact", head: true }).eq("company_id", p.company_id),
          supabase.from("analysis_reports").select("id", { count: "exact", head: true }).eq("company_id", p.company_id),
        ]);

        setStats({
          projects: projectsRes.count ?? 0,
          tenders: tendersRes.count ?? 0,
          reports: reportsRes.count ?? 0,
        });
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <Link to="/">
              <Logo size="sm" />
            </Link>
            <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="text-sm mb-3">
              <p className="font-medium truncate">{profile?.full_name || user?.email}</p>
              <p className="text-muted-foreground text-xs truncate">{companyName || "Sin empresa"}</p>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={signOut}>
              <LogOut size={16} />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="bg-card border-b border-border px-6 py-4 flex items-center gap-4">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold">Dashboard</h1>
        </header>

        <div className="p-6 max-w-7xl mx-auto">
          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1">
              Bienvenido, {profile?.full_name || "Usuario"}
            </h2>
            <p className="text-muted-foreground">
              Aquí tienes un resumen de tu actividad en PliegoSmart.
            </p>
          </div>

          {/* Stats */}
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

          {/* Empty state */}
          {stats.projects === 0 && stats.tenders === 0 && (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Comienza tu primer análisis</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Crea un proyecto, sube un pliego de licitación y deja que nuestra IA lo analice por ti.
              </p>
              <Button>Crear Proyecto</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
