import { motion } from "framer-motion";
import {
  Upload,
  Brain,
  FileCheck,
  TrendingUp,
  Shield,
  Download,
} from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Subida inteligente de PDF",
    description: "Arrastra el pliego completo. Nuestro sistema extrae y estructura toda la información automáticamente.",
  },
  {
    icon: Brain,
    title: "Análisis con IA especializada",
    description: "Motor de IA entrenado en licitaciones de obra civil española. Identifica requisitos, solvencias y criterios.",
  },
  {
    icon: FileCheck,
    title: "Informe estructurado completo",
    description: "Recibe un informe detallado con todos los puntos clave: solvencia, criterios, riesgos y estrategia.",
  },
  {
    icon: TrendingUp,
    title: "Estrategia de puntuación",
    description: "Recomendaciones específicas para maximizar tu puntuación en juicio de valor y criterios automáticos.",
  },
  {
    icon: Shield,
    title: "Detección de riesgos",
    description: "Identifica cláusulas problemáticas, penalizaciones y requisitos que podrían descalificarte.",
  },
  {
    icon: Download,
    title: "Exportación profesional",
    description: "Descarga informes en PDF listos para compartir con tu equipo directivo y departamento técnico.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent font-medium text-sm uppercase tracking-wider">Funcionalidades</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4">
            Del PDF al informe en minutos
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Un flujo automatizado que transforma documentos complejos en
            inteligencia accionable para tu empresa.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative bg-card border border-border rounded-xl p-6 hover:border-accent/40 transition-all hover:shadow-lg"
            >
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <f.icon size={24} className="text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
