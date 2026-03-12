import Logo from "./Logo";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { language } = useLanguage();

  const copy =
    language === "en"
      ? {
          description:
            "Strategic tender AI engine with scoring simulation and technical memory generation.",
          platform: "Platform",
          features: "Features",
          sectors: "Sectors",
          plans: "Plans",
          docs: "Documentation",
          company: "Company",
          about: "About",
          contact: "Contact",
          blog: "Blog",
          legal: "Legal",
          privacy: "Privacy",
          terms: "Terms",
          cookies: "Cookies",
          rights: "All rights reserved.",
          regions: "Argentina · Spain · LATAM · EU",
        }
      : {
          description:
            "Motor estratégico de análisis de licitaciones con IA sectorial. Simulación, scoring y generación de memoria técnica.",
          platform: "Plataforma",
          features: "Funcionalidades",
          sectors: "Sectores",
          plans: "Planes",
          docs: "Documentación",
          company: "Empresa",
          about: "Sobre nosotros",
          contact: "Contacto",
          blog: "Blog",
          legal: "Legal",
          privacy: "Privacidad",
          terms: "Términos",
          cookies: "Cookies",
          rights: "Todos los derechos reservados.",
          regions: "Argentina · España · LATAM · UE",
        };

  return (
    <footer className="bg-foreground text-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <Logo size="sm" className="[&_span]:text-background [&_.text-accent]:text-accent mb-4" />
            <p className="text-sm text-background/60">{copy.description}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">{copy.platform}</h4>
            <ul className="space-y-2 text-sm text-background/60">
              <li><a href="#features" className="hover:text-background transition-colors">{copy.features}</a></li>
              <li><a href="#sectors" className="hover:text-background transition-colors">{copy.sectors}</a></li>
              <li><a href="#pricing" className="hover:text-background transition-colors">{copy.plans}</a></li>
              <li><a href="#" className="hover:text-background transition-colors">{copy.docs}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">{copy.company}</h4>
            <ul className="space-y-2 text-sm text-background/60">
              <li><a href="#" className="hover:text-background transition-colors">{copy.about}</a></li>
              <li><a href="#contact" className="hover:text-background transition-colors">{copy.contact}</a></li>
              <li><a href="tel:+5492645792222" className="hover:text-background transition-colors">+54 9 264 579 2222</a></li>
              <li><a href="mailto:cuyotradingsas@gmail.com" className="hover:text-background transition-colors">cuyotradingsas@gmail.com</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">{copy.legal}</h4>
            <ul className="space-y-2 text-sm text-background/60">
              <li><a href="#" className="hover:text-background transition-colors">{copy.privacy}</a></li>
              <li><a href="#" className="hover:text-background transition-colors">{copy.terms}</a></li>
              <li><a href="#" className="hover:text-background transition-colors">{copy.cookies}</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-background/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-background/40">
          <span>
            © {new Date().getFullYear()} PLIEGO SMART. {copy.rights}
          </span>
          <span>{copy.regions}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
