/**
 * Tipos compartidos para licitaciones y análisis.
 * Fuente única de verdad — no duplicar en otros archivos.
 */

// ─── Tender ──────────────────────────────────────────────────────────────────

export interface Tender {
  id: string;
  project_id: string;
  company_id: string;
  title: string;
  contracting_entity: string | null;
  contract_amount: number | null;
  valor_estimado: number | null;
  duration: string | null;
  submission_deadline: string | null;
  status: TenderStatus;
  sector: string | null;
  garantia_provisional: number | null;
  garantia_definitiva: number | null;
  clasificacion_requerida: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type TenderStatus = "pending" | "processing" | "completed" | "error";

/** Versión resumida para listas (History, Dashboard) */
export interface TenderListItem {
  id: string;
  title: string;
  contracting_entity: string | null;
  contract_amount: number | null;
  sector: string | null;
  status: TenderStatus;
  created_at: string;
  submission_deadline: string | null;
}

// ─── Analysis Report ─────────────────────────────────────────────────────────

export interface AnalysisReport {
  id: string;
  tender_id: string;
  company_id: string;
  status: "processing" | "completed" | "error";
  report_data: ReportData | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Estructura del JSON que devuelve la IA (report_data) */
export interface ReportData {
  sector_detectado: string;
  resumen_ejecutivo: string;
  datos_contractuales: DatosContractuales;
  requisitos_administrativos: RequisitoAdmin[];
  requisitos_tecnicos: RequisitoTecnico[];
  solvencia?: {
    economica?: SolvenciaItem[];
    tecnica?: SolvenciaItem[];
    profesional?: SolvenciaItem[];
  };
  criterios_adjudicacion: CriterioAdjudicacion[];
  analisis_sectorial?: string;
  comparativa_empresa?: ComparativaEmpresa;
  riesgos: Riesgo[];
  estrategia: Estrategia;
  checklist_documental: string[];
  recomendaciones_presentacion: string[];
  scoring: Scoring;
  /** Presente solo en modo contingencia (sin créditos IA) */
  modo_contingencia?: string;
  detalle_documental_preliminar?: string;
}

export interface DatosContractuales {
  objeto_contrato: string;
  entidad_contratante?: string;
  presupuesto_base?: string;
  valor_estimado?: string;
  duracion?: string;
  prorrogas?: string;
  plazo_presentacion?: string;
  tipo_contrato?: string;
  procedimiento?: string;
  garantia_provisional?: string;
  garantia_definitiva?: string;
  clasificacion_requerida?: string;
  lote?: string;
  revision_precios?: string;
  penalidades?: string;
  subcontratacion?: string;
  fuentes?: string;
}

export interface RequisitoAdmin {
  descripcion: string;
  obligatorio?: boolean;
  normativa?: string;
  riesgo_exclusion?: "alto" | "medio" | "bajo";
  fuente?: string;
}

export interface RequisitoTecnico {
  descripcion: string;
  experiencia_minima?: string;
  equipo_minimo?: string;
  medios_minimos?: string;
  fuente?: string;
}

export interface SolvenciaItem {
  texto: string;
  fuente?: string;
}

export interface CriterioAdjudicacion {
  criterio: string;
  tipo: "automatico" | "juicio_valor";
  ponderacion: number;
  formula?: string;
  subapartados?: string;
  fuente?: string;
}

export interface ComparativaEmpresa {
  cumplimiento: "total" | "parcial" | "no_cumple";
  fortalezas?: string[];
  brechas?: string[];
  observaciones?: string;
  acciones_recomendadas?: string;
}

export interface Riesgo {
  tipo: "juridico" | "tecnico" | "economico";
  descripcion: string;
  nivel: "alto" | "medio" | "bajo";
  mitigacion?: string;
  fuente?: string;
}

export interface Estrategia {
  economica?: string;
  tecnica?: string;
  mejoras_propuestas?: string;
  narrativa_recomendada?: string;
}

export interface Scoring {
  iat: number;
  ire: number;
  pea: number;
  iat_detalle?: string;
  ire_detalle?: string;
  pea_detalle?: string;
  recomendacion_presentarse: "alta" | "media" | "baja" | "no_recomendable";
}

// ─── Technical Memory ────────────────────────────────────────────────────────

export interface TechnicalMemory {
  id: string;
  tender_id: string;
  company_id: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
}
