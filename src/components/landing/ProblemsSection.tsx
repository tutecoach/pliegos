import { motion } from "framer-motion";
import { Clock, AlertTriangle, FileX, Scale, TrendingDown, XCircle } from "lucide-react";

const problems = [
  {
    icon: Clock,
    stat: "72h",
    title: "Días de lectura manual",
    description: "Pliegos de cientos de páginas que consumen días enteros de trabajo técnico cualificado.",
  },
  {
    icon: AlertTriangle,
    stat: "35%",
    title: "Riesgos no detectados",
    description: "Cláusulas ocultas, penalizaciones y requisitos críticos que causan exclusión.",
  },
  {
    icon: FileX,
    stat: "1 de 4",
    title: "Ofertas excluidas",
    description: "Presentaciones rechazadas por documentación incompleta o requisitos mal interpretados.",
  },
  {
    icon: Scale,
    stat: "-25%",
    title: "Puntuación subóptima",
    description: "Ofertas que no maximizan criterios de valoración por falta de análisis estratégico.",
  },
  {
    icon: TrendingDown,
    stat: "60%",
    title: "Sin estrategia económica",
    description: "Ofertas económicas sin simulación de escenarios ni análisis de baja temeraria.",
  },
  {
    icon: XCircle,
    stat: "0",
    title: "Memorias genéricas",
    description: "Memorias técnicas que no se adaptan al sector ni a los criterios del pliego.",
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
            El 70% de las ofertas no maximizan su potencial. 
            Las causas son siempre las mismas.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/15 transition-colors">
                  <p.icon size={24} className="text-destructive" />
                </div>
                <span className="text-2xl font-bold text-destructive/70">{p.stat}</span>
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
