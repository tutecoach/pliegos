import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { queryKeys } from "./query-keys";
import type { TenderListItem } from "@/types/tender";

export type { TenderListItem };

// ─── Fetchear licitaciones de una empresa ────────────────────────────────────

async function fetchTenders(companyId: string): Promise<{ tenders: TenderListItem[]; memoriesMap: Record<string, boolean> }> {
  const [tendersRes, memoriesRes] = await Promise.all([
    supabase
      .from("tenders")
      .select("id, title, contracting_entity, contract_amount, sector, status, created_at, submission_deadline")
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("technical_memories")
      .select("tender_id")
      .eq("company_id", companyId),
  ]);

  const memMap: Record<string, boolean> = {};
  (memoriesRes.data || []).forEach((m: { tender_id: string }) => { memMap[m.tender_id] = true; });

  return {
    tenders: (tendersRes.data || []) as TenderListItem[],
    memoriesMap: memMap,
  };
}

export function useTendersQuery(companyId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.tenders(companyId ?? ""),
    queryFn: () => fetchTenders(companyId!),
    enabled: !!companyId,
    staleTime: 30 * 1000, // 30 segundos — datos de negocio que cambian con frecuencia
  });
}

// ─── Fetchear stats + recientes para el Dashboard ────────────────────────────

async function fetchDashboardData(companyId: string) {
  const [companyRes, projectsRes, tendersRes, reportsRes, recentRes] = await Promise.all([
    supabase.from("companies").select("name").eq("id", companyId).single(),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    supabase.from("tenders").select("id", { count: "exact", head: true }).eq("company_id", companyId).is("deleted_at", null),
    supabase.from("analysis_reports").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    supabase.from("tenders")
      .select("id, title, sector, status, created_at, contract_amount")
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return {
    companyName: (companyRes.data as { name: string } | null)?.name ?? "",
    stats: {
      projects: projectsRes.count ?? 0,
      tenders: tendersRes.count ?? 0,
      reports: reportsRes.count ?? 0,
    },
    recentTenders: recentRes.data ?? [],
  };
}

export function useDashboardQuery(companyId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.dashboardStats(companyId ?? ""),
    queryFn: () => fetchDashboardData(companyId!),
    enabled: !!companyId,
    staleTime: 60 * 1000, // 1 minuto
  });
}

// ─── Mutation: eliminar licitación ───────────────────────────────────────────

export function useDeleteTenderMutation(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tenderId, title }: { tenderId: string; title: string }) => {
      const { data, error } = await supabase.functions.invoke("delete-tender", {
        body: { tenderId },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      return title;
    },
    onSuccess: (title) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenders(companyId ?? "") });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats(companyId ?? "") });
      toast({ title: "Licitación eliminada", description: `"${title}" ha sido eliminada.` });
    },
    onError: (err: Error) => {
      toast({ title: "Error al eliminar", description: err.message, variant: "destructive" });
    },
  });
}

// ─── Mutation: reintentar análisis ───────────────────────────────────────────

export function useRetryAnalysisMutation(companyId: string | null | undefined, userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tenderId: string) => {
      const { data: existing } = await supabase
        .from("analysis_reports")
        .select("id")
        .eq("tender_id", tenderId)
        .order("created_at", { ascending: false })
        .limit(1);

      let reportId: string;
      if (existing && existing.length > 0) {
        reportId = (existing[0] as { id: string }).id;
        await supabase.from("analysis_reports").update({ status: "processing", report_data: null } as Record<string, unknown>).eq("id", reportId);
      } else {
        const { data: newReport, error } = await supabase.from("analysis_reports").insert({
          tender_id: tenderId,
          company_id: companyId!,
          created_by: userId!,
          status: "processing",
        }).select("id").single();
        if (error) throw error;
        reportId = (newReport as { id: string }).id;
      }

      await supabase.from("tenders").update({ status: "processing" }).eq("id", tenderId);
      const { error: fnError } = await supabase.functions.invoke("analyze-tender", { body: { reportId } });
      if (fnError) throw fnError;
      return tenderId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenders(companyId ?? "") });
      toast({ title: "Análisis reiniciado", description: "El análisis se ha relanzado correctamente." });
    },
    onError: (err: Error) => {
      toast({ title: "Error al reintentar", description: err.message, variant: "destructive" });
    },
  });
}
