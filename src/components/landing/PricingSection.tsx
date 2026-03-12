import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

type PlanTier = "starter" | "professional" | "enterprise";

interface Plan {
  id: string;
  tier: PlanTier;
  display_name: string;
  description: string;
  features: string[];
  excluded_features: string[];
  highlighted: boolean;
  is_published: boolean;
  sort_order: number;
}

const fallbackPlans: Plan[] = [
  {
    id: "starter",
    tier: "starter",
    display_name: "Starter",
    description: "Para empresas que inician en licitaciones",
    features: [
      "3 análisis de pliegos/mes",
      "Extracción estructurada del PDF",
      "Clasificación sectorial automática",
      "Informe básico con requisitos y riesgos",
      "Checklist documental",
      "1 usuario",
      "Soporte por email",
    ],
    excluded_features: [
      "Simulador de scoring avanzado",
      "Generador de memoria técnica",
      "Matching empresa vs pliego",
    ],
    highlighted: false,
    is_published: true,
    sort_order: 1,
  },
  {
    id: "professional",
    tier: "professional",
    display_name: "Professional",
    description: "Para empresas con volumen de licitaciones",
    features: [
      "Análisis ilimitados",
      "4 capas de análisis profundo",
      "Scoring predictivo (IAT + IRE + PEA)",
      "Simulación económica interactiva",
      "Generador de memoria técnica sectorial",
      "Matching empresa vs pliego",
      "Estrategia competitiva completa",
      "5 usuarios",
      "Soporte prioritario",
    ],
    excluded_features: [],
    highlighted: true,
    is_published: true,
    sort_order: 2,
  },
  {
    id: "enterprise",
    tier: "enterprise",
    display_name: "Enterprise",
    description: "Para grandes constructoras y UTEs",
    features: [
      "Todo en Professional",
      "Multi-empresa",
      "Usuarios ilimitados",
      "Reportes avanzados y exportación",
      "API de integración",
      "Integraciones ERP",
      "Gestor de cuenta dedicado",
      "SLA garantizado",
    ],
    excluded_features: [],
    highlighted: false,
    is_published: true,
    sort_order: 3,
  },
];

const PricingSection = () => {
  const { language } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>(fallbackPlans);

  useEffect(() => {
    const loadPlans = async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("id, tier, display_name, description, features, excluded_features, highlighted, is_published, sort_order")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });

      if (!error && data && data.length > 0) {
        setPlans(data as Plan[]);
      }
    };

    loadPlans();
  }, []);

  const copy =
    language === "en"
      ? {
          badge: "Plans",
          title: "Choose the plan that fits your bidding strategy",
          subtitle: "Compare capabilities by plan. You can customize and publish these plans from settings.",
          cta: "Request Demo",
          popular: "Most popular",
          withoutPrice: "Custom pricing available",
        }
      : {
          badge: "Planes",
          title: "Elige el plan que impulsa tu estrategia de licitaciones",
          subtitle: "Compara capacidades por plan. Puedes personalizarlos y publicarlos desde configuración.",
          cta: "Solicitar Demo",
          popular: "Más popular",
          withoutPrice: "Precios personalizados disponibles",
        };

  return (
    <section id="pricing" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent font-medium text-sm uppercase tracking-wider">{copy.badge}</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4">{copy.title}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{copy.subtitle}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`relative rounded-2xl p-8 border ${
                plan.highlighted ? "border-accent bg-card shadow-xl scale-[1.02]" : "border-border bg-card"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-semibold px-4 py-1 rounded-full">
                  {copy.popular}
                </div>
              )}

              <h3 className="text-xl font-bold mb-1">{plan.display_name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

              <div className="mb-6 text-sm font-medium text-primary">{copy.withoutPrice}</div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check size={16} className="text-accent shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}

                {plan.excluded_features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <X size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full" variant={plan.highlighted ? "default" : "outline"} asChild>
                <Link to="/request-demo">{copy.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
