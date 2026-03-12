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
              <li><a href="https://wa.me/5492645792222" target="_blank" rel="noopener noreferrer" className="hover:text-background transition-colors inline-flex items-center gap-1"><svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-green-500"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>+54 9 264 579 2222</a></li>
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
