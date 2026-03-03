import { motion } from "framer-motion";
import { Clock, AlertTriangle, FileX, Scale } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Horas de lectura manual",
    description: "Pliegos de cientos de páginas que consumen días enteros de trabajo técnico cualificado.",
  },
  {
    icon: AlertTriangle,
    title: "Riesgos no detectados",
    description: "Cláusulas ocultas, penalizaciones y requisitos críticos que pasan desapercibidos.",
  },
  {
    icon: FileX,
    title: "Documentación incompleta",
    description: "Presentaciones rechazadas por faltar documentos administrativos o técnicos.",
  },
  {
    icon: Scale,
    title: "Puntuación subóptima",
    description: "Ofertas que no maximizan los criterios de valoración por falta de análisis estratégico.",
  },
];

const ProblemsSection = () => {
  return (
    <section className="py-24 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            ¿Por qué las empresas pierden licitaciones?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            El 70% de las ofertas presentadas no maximizan su potencial por
            análisis incompletos del pliego.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                <p.icon size={24} className="text-destructive" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;
