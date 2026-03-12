import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const BenefitsSection = () => {
  const { language } = useLanguage();

  const benefits =
    language === "en"
      ? [
          "Reduce tender analysis time from days to minutes with sector-aware AI",
          "Estimate award probability with IAT (Technical Adequacy Index), IRE (Exclusion Risk Index), and PEA (Estimated Award Probability)",
          "Generate sector-specific technical memory documents adapted to each tender",
          "Detect legal, technical and economic risks before submitting",
          "Automatically match tender requirements with your company profile",
          "Simulate economic bid scenarios with low-bid risk analysis",
          "Get complete strategy for auto criteria, qualitative criteria and differentiators",
          "Use smart documentation checklists to avoid exclusion",
        ]
      : [
          "Reduce el análisis de pliegos de días a minutos con IA sectorial",
          "Calcula tu probabilidad real de adjudicación con scoring predictivo: IAT (Índice de Adecuación Técnica), IRE (Índice de Riesgo de Exclusión) y PEA (Probabilidad Estimada de Adjudicación)",
          "Genera memorias técnicas sectoriales adaptadas a cada pliego",
          "Detecta riesgos jurídicos, técnicos y económicos antes de presentar",
          "Cruza automáticamente los requisitos del pliego con el perfil de tu empresa",
          "Simula escenarios de oferta económica con análisis de baja temeraria",
          "Obtén estrategia completa: criterios automáticos, juicio de valor y mejoras diferenciales",
          "Checklist documental inteligente para evitar exclusiones",
        ];

  const copy =
    language === "en"
      ? {
          badge: "Real differentiation",
          title: "Not a PDF reader. Your strategic tender committee.",
          description:
            "PLIEGO SMART combines legal advisory, technical direction, financial analysis and competitive strategy into a single platform.",
          bullets: [
            "Strategic simulator",
            "Legal-technical analyzer",
            "Technical memory generator",
            "Risk evaluator",
            "Scoring optimizer",
            "Digital advisor",
          ],
        }
      : {
          badge: "Diferencial Real",
          title: "No es un lector de PDFs. Es tu comité evaluador estratégico.",
          description:
            "PLIEGO SMART combina las capacidades de un asesor jurídico, un director técnico, un analista financiero y un estratega competitivo en una sola plataforma.",
          bullets: [
            "Simulador estratégico",
            "Analizador jurídico-técnico",
            "Generador de memoria",
            "Evaluador de riesgo",
            "Optimizador de puntuación",
            "Asesor electrónico",
          ],
        };

  return (
    <section id="benefits" className="py-24 bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <span className="text-accent font-medium text-sm uppercase tracking-wider">{copy.badge}</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-6">{copy.title}</h2>
            <p className="text-primary-foreground/70 text-lg leading-relaxed mb-6">{copy.description}</p>
            <div className="grid grid-cols-2 gap-4">
              {copy.bullets.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-medium text-primary-foreground/90">
                  <span className="text-accent">✔</span>
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-3"
          >
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3 bg-primary-foreground/10 rounded-lg px-5 py-3.5"
              >
                <CheckCircle2 size={18} className="text-accent mt-0.5 shrink-0" />
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
