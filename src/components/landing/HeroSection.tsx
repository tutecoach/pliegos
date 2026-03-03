import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Zap size={14} />
              Análisis de licitaciones con IA
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Gana más{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                licitaciones
              </span>{" "}
              con análisis inteligente
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
              Plataforma de IA especializada en análisis de pliegos de obra civil.
              Identifica requisitos, detecta riesgos y maximiza tu puntuación
              en concursos públicos de forma automática.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button size="lg" className="text-base px-8 gap-2">
                Acceder al Sistema
                <ArrowRight size={18} />
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8">
                Solicitar Demo
              </Button>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-accent" />
                Datos seguros
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-accent" />
                +95% precisión
              </div>
            </div>
          </motion.div>

          {/* Right – Decorative card */}
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
                    Informe generado
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Proyecto", value: "Autovía A-45 Tramo III" },
                    { label: "Importe", value: "€12.450.000" },
                    { label: "Plazo", value: "24 meses" },
                    { label: "Riesgo detectado", value: "Medio", accent: true },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className={`text-sm font-semibold ${item.accent ? "text-amber-500" : "text-foreground"}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-xs font-medium mb-2">Criterios detectados</p>
                  <div className="flex gap-2 flex-wrap">
                    {["Juicio de valor (60%)", "Automáticos (40%)", "Solvencia técnica"].map((tag) => (
                      <span key={tag} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
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
