import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { queryKeys } from "./query-keys";

// ─── Fetchear perfil del usuario ────────────────────────────────────────────

async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, company_id, plan_tier")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}

export function useProfileQuery(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.profile(userId ?? ""),
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ─── Fetchear datos de empresa ───────────────────────────────────────────────

async function fetchCompany(companyId: string) {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();
  if (error) throw error;
  return data;
}

export function useCompanyQuery(companyId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.company(companyId ?? ""),
    queryFn: () => fetchCompany(companyId!),
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Fetchear todas las empresas del usuario ─────────────────────────────────

async function fetchUserCompanies(userId: string) {
  const [ucRes, profileRes] = await Promise.all([
    supabase.from("user_companies").select("company_id").eq("user_id", userId),
    supabase.from("profiles").select("company_id").eq("user_id", userId).single(),
  ]);
  const companyIds = new Set<string>();
  const profileData = profileRes.data as { company_id?: string } | null;
  if (profileData?.company_id) companyIds.add(profileData.company_id);
  (ucRes.data || []).forEach((uc: { company_id: string }) => companyIds.add(uc.company_id));

  if (companyIds.size === 0) return [];

  const { data, error } = await supabase
    .from("companies")
    .select("id, name")
    .in("id", Array.from(companyIds));
  if (error) throw error;
  return data ?? [];
}

export function useUserCompaniesQuery(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.companies(userId ?? ""),
    queryFn: () => fetchUserCompanies(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Mutation: cambiar empresa activa ────────────────────────────────────────

export function useSwitchCompanyMutation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newCompanyId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ company_id: newCompanyId })
        .eq("user_id", userId!);
      if (error) throw error;
      return newCompanyId;
    },
    onSuccess: (newCompanyId) => {
      // Invalida el perfil para que el nuevo company_id se refleje
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId ?? "") });
      // Prefetch la nueva empresa
      queryClient.invalidateQueries({ queryKey: queryKeys.company(newCompanyId) });
    },
    onError: (err: Error) => {
      toast({ title: "Error al cambiar empresa", description: err.message, variant: "destructive" });
    },
  });
}
