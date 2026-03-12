import { motion } from "framer-motion";
import {
  HardHat,
  Zap,
  Droplets,
  Monitor,
  Heart,
  Building,
  Factory,
  Truck,
  Radio,
  Leaf,
  Ruler,
  Wrench,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const SectorsSection = () => {
  const { language } = useLanguage();

  const sectors =
    language === "en"
      ? [
          { icon: HardHat, name: "Civil Works", desc: "Construction planning, execution controls and technical compliance" },
          { icon: Zap, name: "Energy", desc: "Electrical standards, permits, infrastructure and SLA constraints" },
          { icon: Droplets, name: "Water & Sanitation", desc: "Flow, pumping, treatment and environmental impact conditions" },
          { icon: Monitor, name: "Technology", desc: "Architecture, cybersecurity, integrations and service levels" },
          { icon: Heart, name: "Healthcare", desc: "Regulatory constraints, traceability and operational protocols" },
          { icon: Building, name: "General Services", desc: "Operational KPIs, process design and service governance" },
          { icon: Factory, name: "Industrial", desc: "Production process quality, safety and technical resources" },
          { icon: Truck, name: "Transport", desc: "Fleet planning, logistics and route operation requirements" },
          { icon: Radio, name: "Telecom", desc: "Coverage, deployment, and infrastructure compatibility" },
          { icon: Leaf, name: "Environmental", desc: "Waste management, sustainability and impact controls" },
          { icon: Ruler, name: "Architecture", desc: "Design, supervision and urban planning constraints" },
          { icon: Wrench, name: "Facility Management", desc: "Integrated maintenance and space-service optimization" },
        ]
      : [
          { icon: HardHat, name: "Obras Civiles", desc: "Dirección de obra, geotécnicos, Gantt, mediciones" },
          { icon: Zap, name: "Energía", desc: "Normativa eléctrica, habilitaciones, SLA técnico" },
          { icon: Droplets, name: "Agua y Saneamiento", desc: "Caudal, bombeo, tratamiento, impacto ambiental" },
          { icon: Monitor, name: "Tecnología", desc: "SLA, arquitectura, ciberseguridad, GDPR" },
          { icon: Heart, name: "Sanidad", desc: "Equipamiento homologado, protocolos, trazabilidad" },
          { icon: Building, name: "Servicios Generales", desc: "Control operativo, KPIs, supervisión" },
          { icon: Factory, name: "Industrial", desc: "Procesos productivos, seguridad, calidad" },
          { icon: Truck, name: "Transporte", desc: "Flotas, logística, planificación de rutas" },
          { icon: Radio, name: "Telecomunicaciones", desc: "Infraestructura, cobertura, despliegue" },
          { icon: Leaf, name: "Ambiental", desc: "Impacto ambiental, gestión residuos, sostenibilidad" },
          { icon: Ruler, name: "Arquitectura", desc: "Proyectos, dirección facultativa, urbanismo" },
          { icon: Wrench, name: "Facility Management", desc: "Mantenimiento integral, gestión espacios" },
        ];

  const heading =
    language === "en"
      ? {
          badge: "Sector Intelligence",
          title: "Specialized logic by industry",
          subtitle: "Each sector activates tailored requirements, scoring and strategic recommendations.",
        }
      : {
          badge: "Análisis Sectorial",
          title: "Lógica especializada por industria",
          subtitle: "Cada sector activa una capa de análisis diferenciada con normativa, requisitos y estrategias específicas.",
        };

  return (
    <section id="sectors" className="py-24 bg-muted/50">
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {sectors.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="bg-card border border-border rounded-xl p-5 hover:border-accent/40 hover:shadow-md transition-all group cursor-default"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
                <s.icon size={20} className="text-accent" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{s.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SectorsSection;
