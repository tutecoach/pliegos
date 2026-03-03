import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Básico",
    price: "99",
    period: "/mes",
    description: "Para empresas que inician en licitaciones",
    features: [
      "5 análisis de pliegos/mes",
      "Informes estructurados",
      "Exportación PDF",
      "1 usuario",
      "Soporte por email",
    ],
    cta: "Comenzar",
    highlighted: false,
  },
  {
    name: "Profesional",
    price: "249",
    period: "/mes",
    description: "Para empresas con volumen de licitaciones",
    features: [
      "25 análisis de pliegos/mes",
      "Informes avanzados con estrategia",
      "Detección de riesgos",
      "5 usuarios",
      "Dashboard de métricas",
      "Soporte prioritario",
    ],
    cta: "Comenzar",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Consultar",
    period: "",
    description: "Para grandes constructoras y UTEs",
    features: [
      "Análisis ilimitados",
      "API de integración",
      "White-label disponible",
      "Usuarios ilimitados",
      "Gestor de cuenta dedicado",
      "SLA garantizado",
    ],
    cta: "Contactar",
    highlighted: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent font-medium text-sm uppercase tracking-wider">Planes</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4">
            Elige el plan que impulse tu empresa
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Todos los planes incluyen acceso completo al motor de IA. Sin compromisos, cancela cuando quieras.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-8 border ${
                plan.highlighted
                  ? "border-accent bg-card shadow-xl scale-105"
                  : "border-border bg-card"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-semibold px-4 py-1 rounded-full">
                  Más popular
                </div>
              )}
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">
                  {plan.price === "Consultar" ? "" : "€"}
                  {plan.price}
                </span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check size={16} className="text-accent shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.highlighted ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
