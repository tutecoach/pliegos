import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import type { CompanyFormData } from "@/schemas/company.schema";
import { toast } from "@/hooks/use-toast";
import { ensureCompanySetupForUser } from "@/lib/company-setup";
import { useEntityCrud } from "@/hooks/useEntityCrud";
import { queryKeys } from "@/hooks/queries/query-keys";

// Tipos locales para cada entidad de empresa
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

const EMPTY_COMPANY: CompanyData = {
  name: "", cif: "", address: "", phone: "", website: "",
  facturacion_anual: "", patrimonio_neto: "", clasificacion_empresarial: "",
  capacidad_tecnica: "", capacidad_economica: "", sectores_actividad: [],
};

// ─── Fetch functions ──────────────────────────────────────────────────────────

async function fetchCompanySetup(userId: string) {
  const { companyId } = await ensureCompanySetupForUser(userId);
  const [compRes, certRes, expRes, teamRes, equipRes, profileRes] = await Promise.all([
    supabase.from("companies").select("*").eq("id", companyId).single(),
    supabase.from("company_certifications").select("*").eq("company_id", companyId),
    supabase.from("company_experience").select("*").eq("company_id", companyId).order("fecha_inicio", { ascending: false }),
    supabase.from("company_team").select("*").eq("company_id", companyId),
    supabase.from("company_equipment").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
    supabase.from("profiles").select("plan_tier").eq("user_id", userId).single(),
  ]);

  const c = compRes.data as Record<string, unknown> | null;
  const companyData: CompanyData = c ? {
    name: (c.name as string) || "",
    cif: (c.cif as string) || "",
    address: (c.address as string) || "",
    phone: (c.phone as string) || "",
    website: (c.website as string) || "",
    facturacion_anual: c.facturacion_anual?.toString() || "",
    patrimonio_neto: c.patrimonio_neto?.toString() || "",
    clasificacion_empresarial: (c.clasificacion_empresarial as string) || "",
    capacidad_tecnica: (c.capacidad_tecnica as string) || "",
    capacidad_economica: (c.capacidad_economica as string) || "",
    sectores_actividad: (c.sectores_actividad as string[]) || [],
  } : EMPTY_COMPANY;

  return {
    companyId,
    companyData,
    planTier: ((profileRes.data as Record<string, unknown> | null)?.plan_tier as string) || "starter",
    certifications: (certRes.data || []) as Certification[],
    experience: (expRes.data || []) as Experience[],
    team: (teamRes.data || []) as TeamMember[],
    equipment: (equipRes.data || []) as Equipment[],
  };
}

/**
 * Hook central para CompanyProfile — versión con React Query.
 * 
 * MEJORA vs versión anterior:
 * - Los datos se cachean por 2 minutos (no se re-fetchean en cada visita al tab)
 * - useEffect eliminado
 * - Cambiar de empresa invalida la caché automáticamente
 */
export function useCompanyProfile() {
  const { user } = useAuth();
  const { currencyOption } = useCurrency();
  const queryClient = useQueryClient();

  // Estado local para edición (derivado de la caché de React Query)
  const [company, setCompany] = useState<CompanyData>(EMPTY_COMPANY);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const { isLoading, data } = useQuery({
    queryKey: queryKeys.company(user?.id ?? ""),
    queryFn: () => fetchCompanySetup(user!.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    // Inicializa el estado local cuando llegan los datos
    select: (result) => {
      return result;
    },
  });

  // Sincronizar estado local cuando cambia la query
  if (data && companyId !== data.companyId) {
    setCompanyId(data.companyId);
    setCompany(data.companyData);
  }

  // Instancias CRUD — usan el companyId establecido por la query
  const certifications = useEntityCrud<Certification>("company_certifications", companyId);
  const experience = useEntityCrud<Experience>("company_experience", companyId);
  const team = useEntityCrud<TeamMember>("company_team", companyId);
  const equipment = useEntityCrud<Equipment>("company_equipment", companyId);

  // Sincronizar arrays de entidades desde la query (solo cuando llegan por primera vez)
  if (data) {
    if (certifications.items.length === 0 && data.certifications.length > 0) {
      certifications.setAll(data.certifications);
    }
    if (experience.items.length === 0 && data.experience.length > 0) {
      experience.setAll(data.experience);
    }
    if (team.items.length === 0 && data.team.length > 0) {
      team.setAll(data.team);
    }
    if (equipment.items.length === 0 && data.equipment.length > 0) {
      equipment.setAll(data.equipment);
    }
  }

  const handleCompanySwitch = async (newCompanyId: string) => {
    try {
      await supabase.from("profiles").update({ company_id: newCompanyId }).eq("user_id", user!.id);
      // Invalida la query para refetch con la nueva empresa
      queryClient.invalidateQueries({ queryKey: queryKeys.company(user?.id ?? "") });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cambiar empresa";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  /**
   * saveCompany recibe los datos ya validados por react-hook-form + Zod
   * (incluyendo sectores_actividad que se maneja como estado externo al form).
   */
  const saveCompany = async (formData: CompanyFormData & { sectores_actividad: string[] }) => {
    if (!companyId) { toast({ title: "No hay empresa vinculada", variant: "destructive" }); return; }
    setSaving(true);
    // Actualiza el estado local para que los badges de sectores queden reactivos
    setCompany((prev) => ({ ...prev, ...formData }));
    const { error } = await supabase.from("companies").update({
      name: formData.name,
      cif: formData.cif || null,
      address: formData.address || null,
      phone: formData.phone || null,
      website: formData.website || null,
      facturacion_anual: formData.facturacion_anual ? parseFloat(formData.facturacion_anual) : null,
      patrimonio_neto: formData.patrimonio_neto ? parseFloat(formData.patrimonio_neto) : null,
      clasificacion_empresarial: formData.clasificacion_empresarial || null,
      capacidad_tecnica: formData.capacidad_tecnica || null,
      capacidad_economica: formData.capacidad_economica || null,
      sectores_actividad: formData.sectores_actividad,
    }).eq("id", companyId);
    setSaving(false);
    if (error) toast({ title: "Error guardando", description: error.message, variant: "destructive" });
    else {
      toast({ title: "✅ Empresa actualizada correctamente" });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats(companyId) });
    }
  };

  const toggleSector = (sector: string) => {
    setCompany((prev) => ({
      ...prev,
      sectores_actividad: prev.sectores_actividad.includes(sector)
        ? prev.sectores_actividad.filter((s) => s !== sector)
        : [...prev.sectores_actividad, sector],
    }));
  };

  return {
    user,
    loading: isLoading,
    saving,
    companyId,
    planTier: data?.planTier ?? "starter",
    company,
    setCompany,
    currencySymbol: currencyOption.symbol,
    saveCompany,
    toggleSector,
    handleCompanySwitch,
    certifications,
    experience,
    team,
    equipment,
  };
}
