import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const benefits = [
  "Reduce el tiempo de análisis de pliegos de días a minutos",
  "Aumenta la tasa de adjudicación con estrategias optimizadas",
  "Elimina errores de documentación que causan exclusiones",
  "Detecta riesgos ocultos en cláusulas contractuales",
  "Genera informes profesionales listos para dirección",
  "Centraliza el historial de todas tus licitaciones",
];

const BenefitsSection = () => {
  return (
    <section id="benefits" className="py-24 bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-accent font-medium text-sm uppercase tracking-wider">Beneficios</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-6">
              Ventaja competitiva real para tu empresa
            </h2>
            <p className="text-primary-foreground/70 text-lg leading-relaxed">
              Las empresas que utilizan PliegoSmart presentan ofertas más
              completas, mejor puntuadas y con menos riesgo de exclusión.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 bg-primary-foreground/10 rounded-lg px-5 py-4"
              >
                <CheckCircle2 size={20} className="text-accent mt-0.5 shrink-0" />
                <span className="text-sm font-medium">{b}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
