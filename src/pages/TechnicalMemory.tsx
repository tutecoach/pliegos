import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Loader2, Sparkles, Download, Save, ArrowLeft, FileText } from "lucide-react";

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

      const { data: existing } = await supabase.from("technical_memories")
        .select("id, content").eq("tender_id", tenderId).order("created_at", { ascending: false }).limit(1).single();
      if (existing) { setMemoryId(existing.id); setContent(existing.content || ""); }
    };
    load();
  }, [user, tenderId]);

  const generate = async () => {
    if (!tenderId || !companyId) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-memory", { body: { tenderId, companyId } });
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

  const exportAsMarkdown = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memoria-tecnica-${tenderTitle.slice(0, 30)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsWord = () => {
    // Generate a simple HTML-based .doc file (compatible with Word)
    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Memoria Técnica - ${tenderTitle}</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.6;margin:2cm;}
h1{font-size:18pt;color:#1a365d;border-bottom:2px solid #1a365d;padding-bottom:6pt;}
h2{font-size:14pt;color:#2d4a7a;margin-top:18pt;}
h3{font-size:12pt;color:#3d5a8a;}
p{margin:6pt 0;}ul{margin:6pt 0 6pt 20pt;}</style></head>
<body>${markdownToHtml(content)}</body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memoria-tecnica-${tenderTitle.slice(0, 30)}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPdf = () => {
    // Use browser print to generate PDF
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast({ title: "Permite ventanas emergentes para exportar PDF", variant: "destructive" }); return; }
    printWindow.document.write(`
<!DOCTYPE html><html><head><meta charset="utf-8"><title>Memoria Técnica - ${tenderTitle}</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.6;margin:2cm;color:#222;}
h1{font-size:18pt;color:#1a365d;border-bottom:2px solid #1a365d;padding-bottom:6pt;}
h2{font-size:14pt;color:#2d4a7a;margin-top:18pt;}
h3{font-size:12pt;color:#3d5a8a;}
@media print{body{margin:0;}}</style></head>
<body>${markdownToHtml(content)}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const markdownToHtml = (md: string) => {
    return md
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/gim, "<em>$1</em>")
      .replace(/^- (.*$)/gim, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/gims, "<ul>$1</ul>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>")
      .replace(/^(.+)$/gm, (match) => match.startsWith("<") ? match : `<p>${match}</p>`);
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
              <Button onClick={generate} size="lg"><Sparkles size={16} className="mr-2" />Generar Memoria Técnica</Button>
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
            <div className="flex items-center gap-2 justify-end flex-wrap">
              <Button variant="outline" size="sm" onClick={exportAsMarkdown}><Download size={14} className="mr-1" />Markdown</Button>
              <Button variant="outline" size="sm" onClick={exportAsWord}><FileText size={14} className="mr-1" />Word (.doc)</Button>
              <Button variant="outline" size="sm" onClick={exportAsPdf}><Download size={14} className="mr-1" />PDF</Button>
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}Guardar
              </Button>
              <Button variant="secondary" size="sm" onClick={generate}><Sparkles size={14} className="mr-1" />Regenerar</Button>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Editor de Memoria Técnica</CardTitle></CardHeader>
              <CardContent>
                <Textarea value={content} onChange={e => setContent(e.target.value)} className="min-h-[600px] font-mono text-sm" />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TechnicalMemory;
