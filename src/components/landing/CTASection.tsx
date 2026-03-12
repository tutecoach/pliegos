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
          primary: "Start now",
          secondary: "Access platform",
        }
      : {
          title: "Deja de leer pliegos. Empieza a ganar licitaciones.",
          subtitle:
            "Únete a las empresas que ya analizan sus pliegos con IA estratégica sectorial: análisis jurídico-técnico, scoring predictivo y memoria técnica en minutos.",
          regions: "Argentina · España · LATAM · Unión Europea",
          primary: "Comenzar ahora",
          secondary: "Acceder al sistema",
        };

  return (
    <section id="contact" className="py-24 bg-muted/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">{copy.title}</h2>
          <p className="text-lg text-muted-foreground mb-4 max-w-2xl mx-auto">{copy.subtitle}</p>
          <p className="text-sm text-muted-foreground/70 mb-8">{copy.regions}</p>
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
