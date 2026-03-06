import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Loader2, Sparkles, Download, Save, ArrowLeft } from "lucide-react";

const TechnicalMemory = () => {
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

  useEffect(() => {
    if (!user || !tenderId) return;
    const load = async () => {
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user.id).single();
      if (profile?.company_id) setCompanyId(profile.company_id);

      const { data: tender } = await supabase.from("tenders").select("title").eq("id", tenderId).single();
      if (tender) setTenderTitle(tender.title);

      // Check for existing memory
      const { data: existing } = await supabase.from("technical_memories")
        .select("id, content").eq("tender_id", tenderId).order("created_at", { ascending: false }).limit(1).single();
      if (existing) {
        setMemoryId(existing.id);
        setContent(existing.content || "");
      }
    };
    load();
  }, [user, tenderId]);

  const generate = async () => {
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
    } catch (err: any) {
      toast({ title: "Error generando memoria", description: err.message, variant: "destructive" });
    }
    setGenerating(false);
  };

  const save = async () => {
    if (!memoryId) return;
    setSaving(true);
    const { error } = await supabase.from("technical_memories")
      .update({ content, status: "edited", updated_at: new Date().toISOString() })
      .eq("id", memoryId);
    setSaving(false);
    if (error) toast({ title: "Error", variant: "destructive" });
    else toast({ title: "Memoria guardada" });
  };

  const exportAsText = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memoria-tecnica-${tenderTitle.slice(0, 30)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft size={20} /></Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Memoria Técnica</h1>
            <p className="text-muted-foreground text-sm">{tenderTitle}</p>
          </div>
        </div>

        {!content && !generating && (
          <Card>
            <CardContent className="p-12 text-center">
              <Sparkles size={48} className="mx-auto text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Generar Memoria Técnica con IA</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                La IA generará una memoria técnica completa, adaptada al sector del pliego,
                los criterios de adjudicación y el perfil de tu empresa.
              </p>
              <Button onClick={generate} size="lg">
                <Sparkles size={16} className="mr-2" />Generar Memoria Técnica
              </Button>
            </CardContent>
          </Card>
        )}

        {generating && (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 size={48} className="mx-auto text-primary mb-4 animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Generando memoria técnica...</h3>
              <p className="text-muted-foreground">Esto puede tardar 1-2 minutos.</p>
            </CardContent>
          </Card>
        )}

        {content && !generating && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 justify-end">
              <Button variant="outline" onClick={exportAsText}><Download size={14} className="mr-1" />Exportar MD</Button>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
                Guardar
              </Button>
              <Button variant="secondary" onClick={generate}>
                <Sparkles size={14} className="mr-1" />Regenerar
              </Button>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Editor de Memoria Técnica</CardTitle></CardHeader>
              <CardContent>
                <Textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="min-h-[600px] font-mono text-sm"
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TechnicalMemory;
