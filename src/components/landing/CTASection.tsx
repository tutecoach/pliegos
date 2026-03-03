import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
            Empieza a ganar más licitaciones hoy
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Únete a las empresas de ingeniería civil que ya analizan sus pliegos
            con inteligencia artificial. Sin instalaciones, sin compromiso.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-base px-8 gap-2">
              Acceder al Sistema
              <ArrowRight size={18} />
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8">
              Solicitar Demo Gratuita
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
