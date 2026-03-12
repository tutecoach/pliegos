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
import { useLanguage } from "@/contexts/LanguageContext";

const FeaturesSection = () => {
  const { language } = useLanguage();

  const layers =
    language === "en"
      ? [
          {
            layer: "Layer 1",
            icon: FileSearch,
            title: "Structured Extraction",
            description: "Automatically identifies sections, critical dates, mandatory annexes, and contractual clauses.",
            color: "from-primary to-primary/70",
          },
          {
            layer: "Layer 2",
            icon: Brain,
            title: "Sector Classification",
            description: "Detects industry context and activates specific logic for that tender domain.",
            color: "from-accent to-accent/70",
          },
          {
            layer: "Layer 3",
            icon: Building2,
            title: "Company Matching",
            description: "Matches experience, financial profile, team and certifications to detect strengths and gaps.",
            color: "from-primary to-accent",
          },
          {
            layer: "Layer 4",
            icon: Target,
            title: "Competitive Strategy",
            description: "Optimizes economic and qualitative criteria, narrative strategy and differentiating improvements.",
            color: "from-accent to-primary",
          },
        ]
      : [
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
            description: "Detección automática del sector con activación de lógica sectorial específica.",
            color: "from-accent to-accent/70",
          },
          {
            layer: "Capa 3",
            icon: Building2,
            title: "Cruce con Empresa",
            description: "Matching de experiencia, facturación, equipo técnico y certificaciones para detectar fortalezas y brechas.",
            color: "from-primary to-accent",
          },
          {
            layer: "Capa 4",
            icon: Target,
            title: "Estrategia Competitiva",
            description: "Optimización de criterios automáticos y subjetivos, estrategia económica y plan técnico diferencial.",
            color: "from-accent to-primary",
          },
        ];

  const capabilities =
    language === "en"
      ? [
          {
            icon: Shield,
            title: "Legal-Technical Analysis",
            description: "Comprehensive review of administrative, technical and compliance requirements.",
          },
          {
            icon: Calculator,
            title: "Scoring Simulator",
            description:
              "IAT (Technical Adequacy Index), IRE (Exclusion Risk Index), and PEA (Estimated Award Probability).",
          },
          {
            icon: FileText,
            title: "Technical Memory Generator",
            description: "Sector-adapted technical memory based on tender requirements and company profile.",
          },
          {
            icon: BarChart3,
            title: "Economic Scenarios",
            description: "Conservative, balanced and aggressive bid scenarios with low-bid risk validation.",
          },
        ]
      : [
          {
            icon: Shield,
            title: "Análisis Jurídico-Técnico",
            description: "Revisión integral de requisitos administrativos, solvencia y normativa aplicable.",
          },
          {
            icon: Calculator,
            title: "Simulador de Scoring",
            description:
              "Índices IAT (Índice de Adecuación Técnica), IRE (Índice de Riesgo de Exclusión) y PEA (Probabilidad Estimada de Adjudicación).",
          },
          {
            icon: FileText,
            title: "Generador de Memoria Técnica",
            description: "Memorias sectoriales adaptadas al pliego, la empresa y los criterios de puntuación.",
          },
          {
            icon: BarChart3,
            title: "Simulación Económica",
            description: "Escenarios de oferta con cálculo de baja temeraria y riesgo estratégico.",
          },
        ];

  const heading =
    language === "en"
      ? {
          badge: "Intelligent Architecture",
          title: "4 layers of deep tender analysis",
          subtitle: "Not a PDF reader: a strategic committee for legal, technical and economic decisions.",
          extraTitle: "Additional capabilities",
          extraSubtitle: "Tools that convert analysis into a competitive edge.",
        }
      : {
          badge: "Arquitectura Inteligente",
          title: "4 capas de análisis profundo",
          subtitle: "No es un lector de PDFs. Es un comité evaluador, asesor jurídico, director técnico y analista financiero.",
          extraTitle: "Capacidades adicionales",
          extraSubtitle: "Herramientas que transforman análisis en ventaja competitiva.",
        };

  return (
    <section id="features" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent font-medium text-sm uppercase tracking-wider">{heading.badge}</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4">{heading.title}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{heading.subtitle}</p>
        </motion.div>

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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h3 className="text-2xl font-bold mb-2">{heading.extraTitle}</h3>
          <p className="text-muted-foreground">{heading.extraSubtitle}</p>
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
