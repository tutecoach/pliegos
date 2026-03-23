/**
 * Tipos compartidos para empresa y sus entidades relacionadas.
 * Extraídos de useCompanyProfile.ts para que sean reutilizables.
 */

export interface CompanyData {
  name: string;
  cif: string;
  address: string;
  phone: string;
  website: string;
  facturacion_anual: string;
  patrimonio_neto: string;
  clasificacion_empresarial: string;
  capacidad_tecnica: string;
  capacidad_economica: string;
  sectores_actividad: string[];
}

export interface Certification {
  id: string;
  company_id: string;
  nombre: string;
  organismo_emisor?: string | null;
  fecha_obtencion?: string | null;
  fecha_vencimiento?: string | null;
  puntuable?: boolean;
  [key: string]: unknown;
}

export interface Experience {
  id: string;
  company_id: string;
  titulo: string;
  cliente?: string | null;
  sector?: string | null;
  importe?: number | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  descripcion?: string | null;
  resultado?: string | null;
  [key: string]: unknown;
}

export interface TeamMember {
  id: string;
  company_id: string;
  nombre: string;
  cargo?: string | null;
  titulacion?: string | null;
  experiencia_anos?: number | null;
  sector_especialidad?: string | null;
  [key: string]: unknown;
}

export interface Equipment {
  id: string;
  company_id: string;
  nombre: string;
  tipo: string;
  descripcion?: string | null;
  cantidad?: number | null;
  estado?: string | null;
  created_at?: string;
  [key: string]: unknown;
}

export interface UserProfile {
  full_name: string | null;
  company_id: string | null;
  plan_tier: string | null;
}

export interface CompanyBasic {
  id: string;
  name: string;
}

export const EMPTY_COMPANY: CompanyData = {
  name: "", cif: "", address: "", phone: "", website: "",
  facturacion_anual: "", patrimonio_neto: "", clasificacion_empresarial: "",
  capacidad_tecnica: "", capacidad_economica: "", sectores_actividad: [],
};
