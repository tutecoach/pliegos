import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Loader2, Sparkles, Download, Save, ArrowLeft, FileText } from "lucide-react";
import { downloadAsMarkdown, downloadAsWord, printAsPdf } from "@/lib/export-utils";
import { toast } from "@/hooks/use-toast";
import { useTechnicalMemory } from "@/hooks/useTechnicalMemory";

/**
 * TechnicalMemory — Refactorizado.
 *
 * ANTES: 186 líneas con lógica + UI + exportación mezcladas.
 * AHORA: Lógica en useTechnicalMemory.ts, exportación en lib/export-utils.ts.
 */
const TechnicalMemory = () => {
  const {
    tenderTitle, content, setContent, generating, saving, loading,
    generate, save, goBack,
  } = useTechnicalMemory();

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={goBack}><ArrowLeft size={20} /></Button>
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
              <Button variant="outline" size="sm" onClick={() => downloadAsMarkdown(content, `memoria-tecnica-${tenderTitle}`)}>
                <Download size={14} className="mr-1" />Markdown
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadAsWord(content, `Memoria Técnica - ${tenderTitle}`, `memoria-tecnica-${tenderTitle}`)}>
                <FileText size={14} className="mr-1" />Word (.doc)
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const ok = printAsPdf(content, `Memoria Técnica - ${tenderTitle}`);
                if (!ok) toast({ title: "Permite ventanas emergentes para exportar PDF", variant: "destructive" });
              }}>
                <Download size={14} className="mr-1" />PDF
              </Button>
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
