import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { TechnicalMemory } from "@/types/tender";

/**
 * Hook para la página de Memoria Técnica.
 * Extrae toda la lógica de negocio del componente de UI.
 */
export function useTechnicalMemory() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tenderId = searchParams.get("tenderId");

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [memoryId, setMemoryId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tenderTitle, setTenderTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !tenderId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const [profileRes, tenderRes, memoryRes] = await Promise.all([
          supabase.from("profiles").select("company_id").eq("user_id", user.id).single(),
          supabase.from("tenders").select("title").eq("id", tenderId).single(),
          supabase
            .from("technical_memories")
            .select("id, content")
            .eq("tender_id", tenderId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (profileRes.data?.company_id) setCompanyId(profileRes.data.company_id);
        if (tenderRes.data) setTenderTitle(tenderRes.data.title);
        if (memoryRes.data) {
          setMemoryId(memoryRes.data.id);
          setContent(memoryRes.data.content || "");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error al cargar datos";
        toast({ title: "Error", description: msg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, tenderId]);

  const generate = useCallback(async () => {
    if (!tenderId || !companyId) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-memory", {
        body: { tenderId, companyId },
      });
      if (error) throw error;
      setContent(data.content);
      setMemoryId(data.memory_id);
      toast({ title: "Memoria técnica generada" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error generando memoria";
      toast({ title: "Error generando memoria", description: msg, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }, [tenderId, companyId]);

  const save = useCallback(async () => {
    if (!memoryId) return;
    setSaving(true);
    const { error } = await supabase
      .from("technical_memories")
      .update({ content, status: "edited", updated_at: new Date().toISOString() })
      .eq("id", memoryId);
    setSaving(false);
    if (error) toast({ title: "Error", variant: "destructive" });
    else toast({ title: "Memoria guardada" });
  }, [memoryId, content]);

  return {
    tenderId,
    tenderTitle,
    content,
    setContent,
    memoryId,
    generating,
    saving,
    loading,
    generate,
    save,
    goBack: () => navigate(-1),
  };
}
