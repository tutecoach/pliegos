import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const CTASection = () => {
  const { language } = useLanguage();

  const copy =
    language === "en"
      ? {
          title: "Stop reading tenders. Start winning them.",
          subtitle:
            "Join companies that already run strategic AI analysis in minutes: legal review, scoring simulation and technical memory generation.",
          regions: "Argentina · Spain · LATAM · European Union",
          primary: "Request a Demo",
          secondary: "Access platform",
        }
      : {
          title: "Deja de leer pliegos. Empieza a ganar licitaciones.",
          subtitle:
            "Únete a las empresas que ya analizan sus pliegos con IA estratégica sectorial: análisis jurídico-técnico, scoring predictivo y memoria técnica en minutos.",
          regions: "Argentina · España · LATAM · Unión Europea",
          primary: "Solicitar Demo",
          secondary: "Acceder al sistema",
        };

  return (
    <section id="contact" className="py-24 bg-muted/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">{copy.title}</h2>
          <p className="text-lg text-muted-foreground mb-4 max-w-2xl mx-auto">{copy.subtitle}</p>
          <p className="text-sm text-muted-foreground/70 mb-2">{copy.regions}</p>
          <p className="text-sm text-muted-foreground/70 mb-1 flex items-center justify-center gap-2">
            <a href="https://wa.me/5492645792222" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors inline-flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-500"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              +54 9 264 579 2222
            </a>
          </p>
          <p className="text-sm text-muted-foreground/70 mb-8">
            <a href="mailto:cuyotradingsas@gmail.com" className="hover:text-foreground transition-colors">✉️ cuyotradingsas@gmail.com</a>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-base px-8 gap-2" asChild>
              <Link to="/register">
                {copy.primary}
                <ArrowRight size={18} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" asChild>
              <Link to="/login">{copy.secondary}</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
