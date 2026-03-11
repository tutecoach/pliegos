import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Logo from "@/components/landing/Logo";
import {
  LayoutDashboard, FileText, Building2,
  Settings, LogOut, Menu, X, Sparkles, Clock, BarChart3,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Sparkles, label: "Nuevo Análisis", href: "/dashboard/new-analysis" },
  { icon: Clock, label: "Historial", href: "/dashboard/history" },
  { icon: Building2, label: "Mi Empresa", href: "/dashboard/company" },
  { icon: Settings, label: "Configuración", href: "/dashboard/settings" },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (href: string) => location.pathname === href || 
    (href === "/dashboard/history" && (location.pathname === "/dashboard/tenders" || location.pathname === "/dashboard/reports" || location.pathname.startsWith("/dashboard/report/") || location.pathname.startsWith("/dashboard/informe/")));

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <Link to="/"><Logo size="sm" /></Link>
            <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(item => (
              <Link key={item.href} to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                <item.icon size={18} />{item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-border">
            <div className="text-sm mb-3">
              <p className="font-medium truncate">{user?.email}</p>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={signOut}>
              <LogOut size={16} />Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <main className="flex-1 min-w-0">
        <header className="bg-card border-b border-border px-6 py-4 flex items-center gap-4 lg:hidden">
          <button className="text-foreground" onClick={() => setSidebarOpen(true)}><Menu size={24} /></button>
        </header>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
