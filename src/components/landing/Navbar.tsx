import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { useLanguage } from "@/contexts/LanguageContext";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { language, setLanguage } = useLanguage();

  const copy =
    language === "en"
      ? {
          links: [
            { label: "Features", href: "#features" },
            { label: "Sectors", href: "#sectors" },
            { label: "Benefits", href: "#benefits" },
            { label: "Plans", href: "#pricing" },
          ],
          login: "Log in",
          start: "Get started",
        }
      : {
          links: [
            { label: "Funcionalidades", href: "#features" },
            { label: "Sectores", href: "#sectors" },
            { label: "Beneficios", href: "#benefits" },
            { label: "Planes", href: "#pricing" },
          ],
          login: "Iniciar sesión",
          start: "Comenzar",
        };

  const toggleLanguage = () => setLanguage(language === "es" ? "en" : "es");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo size="sm" />

          <div className="hidden md:flex items-center gap-8">
            {copy.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button size="sm" asChild>
              <Link to="/request-demo">{copy.start}</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={toggleLanguage}>
              {language.toUpperCase()}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">{copy.login}</Link>
            </Button>
          </div>

          <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-background border-b border-border px-4 pb-4 space-y-3">
          {copy.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="block text-sm font-medium text-muted-foreground py-2"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm" className="w-full" onClick={toggleLanguage}>
              {language.toUpperCase()}
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/login" onClick={() => setOpen(false)}>
                {copy.login}
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register" onClick={() => setOpen(false)}>
                {copy.start}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
