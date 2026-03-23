import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { queryKeys } from "./query-keys";
import type { Tender, AnalysisReport, ReportData } from "@/types/tender";

// ─── Fetch report + tender por tenderId ──────────────────────────────────────

interface ReportViewData {
  tender: Tender;
  reportData: ReportData | null;
  reportId: string | null;
}

async function fetchReportView(tenderId: string): Promise<ReportViewData> {
  const [tenderRes, reportRes] = await Promise.all([
    supabase.from("tenders").select("*").eq("id", tenderId).single(),
    supabase
      .from("analysis_reports")
      .select("id, report_data, status")
      .eq("tender_id", tenderId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (tenderRes.error) throw tenderRes.error;

  return {
    tender: tenderRes.data as Tender,
    reportData: (reportRes.data?.report_data as ReportData) ?? null,
    reportId: reportRes.data?.id ?? null,
  };
}

export function useReportViewQuery(tenderId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.analysisReport(tenderId ?? ""),
    queryFn: () => fetchReportView(tenderId!),
    enabled: !!tenderId,
    staleTime: 30 * 1000,
  });
}

// ─── Mutation: re-analizar (consolidada) ─────────────────────────────────────

/**
 * Mutation reutilizable para re-analizar un tender.
 * Consolida la lógica que antes estaba duplicada en ReportView y useTendersQueries.
 */
export function useReanalyzeMutation(onComplete?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenderId,
      companyId,
      userId,
    }: {
      tenderId: string;
      companyId: string;
      userId: string;
    }) => {
      // Buscar report existente o crear uno nuevo
      const { data: existing } = await supabase
        .from("analysis_reports")
        .select("id")
        .eq("tender_id", tenderId)
        .order("created_at", { ascending: false })
        .limit(1);

      let reportId: string;
      if (existing && existing.length > 0) {
        reportId = (existing[0] as { id: string }).id;
        await supabase
          .from("analysis_reports")
          .update({ status: "processing", report_data: null } as Record<string, unknown>)
          .eq("id", reportId);
      } else {
        const { data: newReport, error } = await supabase
          .from("analysis_reports")
          .insert({
            tender_id: tenderId,
            company_id: companyId,
            created_by: userId,
            status: "processing",
          })
          .select("id")
          .single();
        if (error) throw error;
        reportId = (newReport as { id: string }).id;
      }

      await supabase.from("tenders").update({ status: "processing" }).eq("id", tenderId);

      const { error: fnError } = await supabase.functions.invoke("analyze-tender", {
        body: { reportId },
      });
      if (fnError) throw fnError;

      return { tenderId, reportId };
    },
    onSuccess: ({ tenderId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analysisReport(tenderId) });
      toast({
        title: "Re-análisis iniciado",
        description: "El análisis integral se está procesando con todos los documentos.",
      });
      onComplete?.();
    },
    onError: (err: Error) => {
      toast({
        title: "Error al re-analizar",
        description: err.message,
        variant: "destructive",
      });
    },
  });
}
