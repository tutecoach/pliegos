import { motion } from "framer-motion";
import { ArrowRight, Shield, BarChart3, Brain, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroSection = () => {
  const { language } = useLanguage();

  const copy =
    language === "en"
      ? {
          badge: "Strategic Tender AI Engine",
          titleA: "Don’t just read tenders.",
          titleB: "Win contracts.",
          description:
            "PLIEGO SMART combines legal-technical analysis, scoring simulation, and sector-specific technical memory generation to maximize your award probability.",
          sectors: "Civil Works · Energy · Technology · Healthcare · Water · Telecom · and more",
          ctaPrimary: "Request a Demo",
          ctaSecondary: "Access platform",
          safe: "Secure multi-tenant",
          scoring: "Predictive scoring",
          sectorsCount: "12+ sectors",
          completed: "Strategic analysis completed",
          labels: [
            { label: "Detected sector", value: "Civil Works" },
            { label: "Budget", value: "€12,450,000" },
            { label: "Execution period", value: "24 months" },
            { label: "Exclusion risk", value: "Low", color: "text-primary" },
          ],
          awardProb: "Award Probability",
          tags: [
            "IAT (Technical Adequacy Index): 0.87",
            "IRE (Exclusion Risk Index): Low",
            "PEA (Estimated Award Probability): 78%",
            "Value-based criteria: 60%",
          ],
        }
      : {
          badge: "Motor Estratégico de Licitaciones con IA",
          titleA: "No analices pliegos.",
          titleB: "Gana licitaciones.",
          description:
            "PLIEGO SMART combina análisis jurídico-técnico, simulación de puntuación y generación de memoria técnica sectorial para maximizar tu probabilidad de adjudicación.",
          sectors: "Obras civiles · Energía · Tecnología · Sanidad · Agua · Telecomunicaciones · y más sectores",
          ctaPrimary: "Comenzar ahora",
          ctaSecondary: "Acceder al sistema",
          safe: "Multi-tenant seguro",
          scoring: "Scoring predictivo",
          sectorsCount: "+12 sectores",
          completed: "Análisis estratégico completado",
          labels: [
            { label: "Sector detectado", value: "Obras Civiles" },
            { label: "Presupuesto", value: "€12.450.000" },
            { label: "Plazo ejecución", value: "24 meses" },
            { label: "Riesgo exclusión", value: "Bajo", color: "text-primary" },
          ],
          awardProb: "Probabilidad de Adjudicación",
          tags: [
            "IAT (Índice de Adecuación Técnica): 0.87",
            "IRE (Índice de Riesgo de Exclusión): Bajo",
            "PEA (Probabilidad Estimada de Adjudicación): 78%",
            "Juicio valor 60%",
          ],
        };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/5" />
      <div className="absolute top-20 right-0 w-[700px] h-[700px] rounded-full bg-accent/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/3 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Brain size={14} />
              {copy.badge}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              {copy.titleA}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{copy.titleB}</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-4 max-w-xl">{copy.description}</p>
            <p className="text-sm text-muted-foreground/80 mb-8 max-w-xl">{copy.sectors}</p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button size="lg" className="text-base px-8 gap-2" asChild>
                <Link to="/register">
                  {copy.ctaPrimary}
                  <ArrowRight size={18} />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8" asChild>
                <Link to="/login">{copy.ctaSecondary}</Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-accent" />
                {copy.safe}
              </div>
              <div className="flex items-center gap-2">
                <Target size={16} className="text-accent" />
                {copy.scoring}
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-accent" />
                {copy.sectorsCount}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-2xl" />
              <div className="relative bg-card border border-border rounded-2xl p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <Logo size="sm" />
                  <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">{copy.completed}</span>
                </div>

                <div className="space-y-3">
                  {copy.labels.map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className={`text-sm font-semibold ${item.color || "text-foreground"}`}>{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-primary">{copy.awardProb}</p>
                    <span className="text-lg font-bold text-primary">78%</span>
                  </div>
                  <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "78%" }}
                      transition={{ duration: 1.2, delay: 0.8 }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-2 flex-wrap">
                  {copy.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
