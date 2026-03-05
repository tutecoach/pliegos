import { motion } from "framer-motion";
import {
  FileSearch,
  Brain,
  Building2,
  Target,
  Shield,
  FileText,
  Calculator,
  BarChart3,
} from "lucide-react";

const layers = [
  {
    layer: "Capa 1",
    icon: FileSearch,
    title: "Extracción Estructurada",
    description: "Identificación automática de secciones, clasificación de cláusulas, detección de fechas críticas y anexos obligatorios.",
    color: "from-primary to-primary/70",
  },
  {
    layer: "Capa 2",
    icon: Brain,
    title: "Clasificación Sectorial",
    description: "Detección automática del sector (Obras, Energía, Tecnología, Sanidad, etc.) con activación de lógica sectorial específica.",
    color: "from-accent to-accent/70",
  },
  {
    layer: "Capa 3",
    icon: Building2,
    title: "Cruce con Empresa",
    description: "Matching de experiencia, facturación, equipo técnico y certificaciones. Identifica fortalezas y brechas estratégicas.",
    color: "from-primary to-accent",
  },
  {
    layer: "Capa 4",
    icon: Target,
    title: "Estrategia Competitiva",
    description: "Optimización de criterios automáticos y subjetivos, estrategia económica, plan de narrativa técnica y mejoras diferenciales.",
    color: "from-accent to-primary",
  },
];

const capabilities = [
  {
    icon: Shield,
    title: "Análisis Jurídico-Técnico",
    description: "Revisión integral de requisitos administrativos, solvencia y normativa aplicable.",
  },
  {
    icon: Calculator,
    title: "Simulador de Scoring",
    description: "Índices IAT, IRE y PEA que calculan tu probabilidad real de adjudicación.",
  },
  {
    icon: FileText,
    title: "Generador de Memoria Técnica",
    description: "Memorias sectoriales adaptadas al pliego, la empresa y los criterios de puntuación.",
  },
  {
    icon: BarChart3,
    title: "Simulación Económica",
    description: "Escenarios de oferta (conservador, moderado, agresivo) con cálculo de baja temeraria.",
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
          <span className="text-accent font-medium text-sm uppercase tracking-wider">Arquitectura Inteligente</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4">
            4 capas de análisis profundo
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            No es un lector de PDFs. Es un comité evaluador, asesor jurídico, 
            director técnico y analista financiero trabajando para ti.
          </p>
        </motion.div>

        {/* 4 Layers */}
        <div className="grid sm:grid-cols-2 gap-6 mb-20">
          {layers.map((l, i) => (
            <motion.div
              key={l.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative bg-card border border-border rounded-xl p-6 hover:border-accent/40 transition-all hover:shadow-lg overflow-hidden group"
            >
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${l.color}`} />
              <div className="flex items-start gap-4 pl-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                  <l.icon size={24} className="text-accent" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-accent uppercase tracking-wider">{l.layer}</span>
                  <h3 className="font-semibold text-lg mb-1">{l.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{l.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional capabilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h3 className="text-2xl font-bold mb-2">Capacidades adicionales</h3>
          <p className="text-muted-foreground">Herramientas que transforman análisis en ventaja competitiva.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {capabilities.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-xl p-5 hover:border-accent/40 hover:shadow-lg transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <c.icon size={20} className="text-primary" />
              </div>
              <h4 className="font-semibold text-sm mb-1">{c.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
