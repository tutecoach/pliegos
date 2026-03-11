import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, BarChart3, Brain, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Logo from "./Logo";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/5" />
      <div className="absolute top-20 right-0 w-[700px] h-[700px] rounded-full bg-accent/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/3 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Brain size={14} />
              Motor Estratégico de Licitaciones con IA
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              No analices pliegos.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Gana licitaciones.
              </span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-4 max-w-xl">
              PLIEGO SMART es el primer motor estratégico que combina análisis jurídico-técnico, 
              simulación de puntuación y generación de memoria técnica sectorial 
              para maximizar tu probabilidad de adjudicación.
            </p>

            <p className="text-sm text-muted-foreground/80 mb-8 max-w-xl">
              Obras civiles · Energía · Tecnología · Sanidad · Agua · Telecomunicaciones · y más sectores
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
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

            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-accent" />
                Multi-tenant seguro
              </div>
              <div className="flex items-center gap-2">
                <Target size={16} className="text-accent" />
                Scoring predictivo
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-accent" />
                +12 sectores
              </div>
            </div>
          </motion.div>

          {/* Right – Strategic analysis preview */}
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
                  <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                    Análisis estratégico completado
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Sector detectado", value: "Obras Civiles" },
                    { label: "Presupuesto", value: "€12.450.000" },
                    { label: "Plazo ejecución", value: "24 meses" },
                    { label: "Riesgo exclusión", value: "Bajo", color: "text-green-600" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className={`text-sm font-semibold ${item.color || "text-foreground"}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Scoring preview */}
                <div className="mt-5 p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-primary">Probabilidad de Adjudicación</p>
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
                  {["IAT (Adecuación Técnica): 0.87", "IRE (Riesgo Exclusión): Bajo", "PEA (Prob. Adjudicación): 78%", "Juicio valor 60%"].map((tag) => (
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
