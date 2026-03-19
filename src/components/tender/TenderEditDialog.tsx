import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import PdfUploader from "@/components/tender/PdfUploader";
import { Loader2, Save, FileText, Trash2, Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const SECTORES = [
  "Obras Civiles", "Energía", "Agua y Saneamiento", "Tecnología",
  "Sanidad", "Servicios Generales", "Industrial", "Transporte",
  "Telecomunicaciones", "Ambiental", "Arquitectura", "Facility Management",
];

interface TenderEditDialogProps {
  tenderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

interface ExistingDoc {
  id: string;
  file_name: string;
  file_size: number | null;
  created_at: string;
}

const TenderEditDialog = ({ tenderId, open, onOpenChange, onSaved }: TenderEditDialogProps) => {
  const { user } = useAuth();
  const { currencyOption } = useCurrency();
  const sym = currencyOption.symbol;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [existingDocs, setExistingDocs] = useState<ExistingDoc[]>([]);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [contractingEntity, setContractingEntity] = useState("");
  const [contractAmount, setContractAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [deadline, setDeadline] = useState("");
  const [sector, setSector] = useState("");
  const [garantiaProv, setGarantiaProv] = useState("");
  const [garantiaDef, setGarantiaDef] = useState("");
  const [clasificacionReq, setClasificacionReq] = useState("");
  const [valorEstimado, setValorEstimado] = useState("");

  const loadTenderData = async () => {
    if (!tenderId) return;
    setLoading(true);

    const [tenderRes, docsRes] = await Promise.all([
      supabase.from("tenders").select("*").eq("id", tenderId).single(),
      supabase.from("tender_documents").select("id, file_name, file_size, created_at").eq("tender_id", tenderId).order("created_at", { ascending: true }),
    ]);

    if (tenderRes.data) {
      const t = tenderRes.data;
      setTitle(t.title || "");
      setContractingEntity(t.contracting_entity || "");
      setContractAmount(t.contract_amount ? String(t.contract_amount) : "");
      setDuration(t.duration || "");
      setDeadline(t.submission_deadline ? t.submission_deadline.slice(0, 16) : "");
      setSector(t.sector || "");
      setGarantiaProv(t.garantia_provisional ? String(t.garantia_provisional) : "");
      setGarantiaDef(t.garantia_definitiva ? String(t.garantia_definitiva) : "");
      setClasificacionReq(t.clasificacion_requerida || "");
      setValorEstimado(t.valor_estimado ? String(t.valor_estimado) : "");
      setCompanyId(t.company_id);
    }

    setExistingDocs(docsRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open && tenderId) {
      loadTenderData();
    }
  }, [open, tenderId]);

  const handleSave = async () => {
    if (!tenderId) return;
    if (!title.trim()) {
      toast({ title: "El título es obligatorio", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("tenders").update({
      title: title.trim(),
      contracting_entity: contractingEntity.trim() || null,
      contract_amount: contractAmount ? parseFloat(contractAmount) : null,
      duration: duration.trim() || null,
      submission_deadline: deadline || null,
      sector: sector || null,
      garantia_provisional: garantiaProv ? parseFloat(garantiaProv) : null,
      garantia_definitiva: garantiaDef ? parseFloat(garantiaDef) : null,
      clasificacion_requerida: clasificacionReq || null,
      valor_estimado: valorEstimado ? parseFloat(valorEstimado) : null,
    }).eq("id", tenderId);

    setSaving(false);
    if (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Datos actualizados correctamente" });
      onSaved();
    }
  };

  const handleDeleteDoc = async (docId: string, fileName: string) => {
    setDeletingDoc(docId);
    try {
      // Get file_path first
      const { data: doc } = await supabase.from("tender_documents").select("file_path").eq("id", docId).single();
      if (doc?.file_path) {
        await supabase.storage.from("tender-documents").remove([doc.file_path]);
      }
      await supabase.from("tender_documents").delete().eq("id", docId);
      setExistingDocs(prev => prev.filter(d => d.id !== docId));
      toast({ title: `"${fileName}" eliminado` });
    } catch (err: any) {
      toast({ title: "Error al eliminar documento", description: err.message, variant: "destructive" });
    } finally {
      setDeletingDoc(null);
    }
  };

  const handleReanalyze = async () => {
    if (!tenderId || !companyId || !user || reanalyzing) return;
    if (existingDocs.length < 1) {
      toast({ title: "Sin documentos", description: "Subí al menos un documento antes de re-analizar.", variant: "destructive" });
      return;
    }
    setReanalyzing(true);
    try {
      // Find existing report or create new one
      const { data: existing } = await supabase
        .from("analysis_reports")
        .select("id")
        .eq("tender_id", tenderId)
        .order("created_at", { ascending: false })
        .limit(1);

      let reportId: string;
      if (existing && existing.length > 0) {
        reportId = existing[0].id;
        await supabase.from("analysis_reports").update({ status: "processing", report_data: null } as any).eq("id", reportId);
      } else {
        const { data: newReport, error } = await supabase.from("analysis_reports").insert({
          tender_id: tenderId,
          company_id: companyId,
          created_by: user.id,
          status: "processing",
        }).select("id").single();
        if (error) throw error;
        reportId = newReport.id;
      }

      await supabase.from("tenders").update({ status: "processing" }).eq("id", tenderId);

      const { error } = await supabase.functions.invoke("analyze-tender", { body: { reportId } });
      if (error) throw error;

      toast({ title: "¡Re-análisis completado!", description: "El informe se ha actualizado con los nuevos documentos." });
      // Note: if modo_contingencia, user will see the warning banner in the report view
    } catch (err: any) {
      toast({ title: "Error en el re-análisis", description: err.message, variant: "destructive" });
    } finally {
      setReanalyzing(false);
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Licitación</SheetTitle>
          <SheetDescription>Modificá los datos y subí documentos adicionales para mejorar el análisis.</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : (
          <Tabs defaultValue="datos" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="datos">Datos</TabsTrigger>
              <TabsTrigger value="documentos">
                Documentos
                <Badge variant="secondary" className="ml-2 text-xs">{existingDocs.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="datos" className="space-y-4 mt-4">
              <div>
                <Label>Título *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>Entidad contratante</Label>
                <Input value={contractingEntity} onChange={e => setContractingEntity(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Presupuesto base ({sym})</Label><CurrencyInput value={contractAmount} onChange={setContractAmount} /></div>
                <div><Label>Valor estimado ({sym})</Label><CurrencyInput value={valorEstimado} onChange={setValorEstimado} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Duración</Label><Input value={duration} onChange={e => setDuration(e.target.value)} /></div>
                <div><Label>Fecha límite</Label><Input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Garantía provisional ({sym})</Label><CurrencyInput value={garantiaProv} onChange={setGarantiaProv} /></div>
                <div><Label>Garantía definitiva ({sym})</Label><CurrencyInput value={garantiaDef} onChange={setGarantiaDef} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Clasificación requerida</Label><Input value={clasificacionReq} onChange={e => setClasificacionReq(e.target.value)} /></div>
                <div>
                  <Label>Sector</Label>
                  <Select value={sector} onValueChange={setSector}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>{SECTORES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                Guardar cambios
              </Button>
            </TabsContent>

            <TabsContent value="documentos" className="space-y-4 mt-4">
              {/* Existing documents */}
              {existingDocs.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Documentos actuales</Label>
                  {existingDocs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 bg-muted/50 border border-border rounded-lg p-3">
                      <FileText size={18} className="text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatSize(doc.file_size)} · {new Date(doc.created_at).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteDoc(doc.id, doc.file_name)}
                        disabled={deletingDoc === doc.id}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        title="Eliminar documento"
                      >
                        {deletingDoc === doc.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload more */}
              <div>
                <Label className="text-sm font-semibold">Agregar nuevos documentos</Label>
                <div className="mt-2">
                  <PdfUploader
                    tenderId={tenderId!}
                    onUploadComplete={(docIds) => {
                      toast({ title: `${docIds.length} documento(s) agregado(s)` });
                      loadTenderData();
                    }}
                  />
                </div>
              </div>

              {/* Re-analyze button */}
              <Separator />
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
                <div>
                  <p className="text-sm font-semibold">Re-analizar con documentación actualizada</p>
                  <p className="text-xs text-muted-foreground">
                    Ejecuta nuevamente el motor IA de 4 capas considerando todos los documentos actuales. El informe anterior será reemplazado.
                  </p>
                </div>
                <Button onClick={handleReanalyze} disabled={reanalyzing || existingDocs.length < 1} className="w-full">
                  {reanalyzing ? (
                    <><Loader2 size={16} className="animate-spin mr-2" />Re-analizando...</>
                  ) : (
                    <><Sparkles size={16} className="mr-2" />Re-analizar ({existingDocs.length} documento{existingDocs.length !== 1 ? "s" : ""})</>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default TenderEditDialog;
