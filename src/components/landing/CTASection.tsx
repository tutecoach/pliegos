import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section id="contact" className="py-24 bg-muted/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Deja de leer pliegos. Empieza a ganar licitaciones.
          </h2>
          <p className="text-lg text-muted-foreground mb-4 max-w-2xl mx-auto">
            Únete a las empresas que ya analizan sus pliegos con IA estratégica sectorial.
            Análisis jurídico-técnico, scoring predictivo y memoria técnica en minutos.
          </p>
          <p className="text-sm text-muted-foreground/70 mb-8">
            Argentina · España · LATAM · Unión Europea
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-base px-8 gap-2" asChild>
              <Link to="/register">
                Comenzar Ahora
                <ArrowRight size={18} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" asChild>
              <Link to="/login">Acceder al Sistema</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
