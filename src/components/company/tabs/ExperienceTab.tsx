import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Briefcase, Plus, Save, Trash2 } from "lucide-react";
import { SECTORES } from "@/data/sectores";
import type { Experience } from "@/hooks/useCompanyProfile";
import type { useEntityCrud } from "@/hooks/useEntityCrud";

interface ExperienceTabProps {
  crud: ReturnType<typeof useEntityCrud<Experience>>;
  currencySymbol: string;
}

export default function ExperienceTab({ crud, currencySymbol }: ExperienceTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Briefcase size={18} /> Obras / Proyectos Ejecutados</CardTitle>
          <CardDescription>Experiencia previa para matching</CardDescription>
        </div>
        <Button size="sm" onClick={() => crud.add({ titulo: "Nueva experiencia" }, true)}>
          <Plus size={14} className="mr-1" />Añadir
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {crud.items.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">Sin experiencias registradas.</p>
        )}
        {crud.items.map((exp) => (
          <div key={exp.id} className="border border-border rounded-lg p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Título</Label>
                <Input value={exp.titulo} onChange={(e) => crud.updateField(exp.id, "titulo", e.target.value)} />
              </div>
              <div>
                <Label>Cliente</Label>
                <Input value={exp.cliente || ""} onChange={(e) => crud.updateField(exp.id, "cliente", e.target.value)} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Sector</Label>
                <Select value={exp.sector || ""} onValueChange={(v) => crud.updateField(exp.id, "sector", v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{SECTORES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Importe ({currencySymbol})</Label>
                <CurrencyInput value={exp.importe?.toString() || ""} onChange={(v) => crud.updateField(exp.id, "importe", v)} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Fecha Inicio</Label>
                <Input type="date" value={exp.fecha_inicio || ""} onChange={(e) => crud.updateField(exp.id, "fecha_inicio", e.target.value)} />
              </div>
              <div>
                <Label>Fecha Culminación</Label>
                <Input type="date" value={exp.fecha_fin || ""} onChange={(e) => crud.updateField(exp.id, "fecha_fin", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={exp.descripcion || ""} onChange={(e) => crud.updateField(exp.id, "descripcion", e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="destructive" onClick={() => crud.remove(exp.id)}>
                <Trash2 size={14} />
              </Button>
              <Button size="sm" onClick={() => crud.save(exp.id, {
                titulo: exp.titulo,
                cliente: exp.cliente,
                sector: exp.sector,
                importe: exp.importe ? parseFloat(String(exp.importe)) : null,
                fecha_inicio: exp.fecha_inicio || null,
                fecha_fin: exp.fecha_fin || null,
                descripcion: exp.descripcion,
                resultado: exp.resultado,
              }, "Experiencia guardada")}>
                <Save size={14} className="mr-1" />Guardar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
