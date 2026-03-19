import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Save, Trash2 } from "lucide-react";
import { SECTORES } from "@/data/sectores";
import type { TeamMember } from "@/hooks/useCompanyProfile";
import type { useEntityCrud } from "@/hooks/useEntityCrud";

interface TeamTabProps {
  crud: ReturnType<typeof useEntityCrud<TeamMember>>;
}

export default function TeamTab({ crud }: TeamTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Users size={18} /> Equipo Técnico</CardTitle>
          <CardDescription>Personal clave para licitaciones</CardDescription>
        </div>
        <Button size="sm" onClick={() => crud.add({ nombre: "Nuevo miembro" })}>
          <Plus size={14} className="mr-1" />Añadir
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {crud.items.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">Sin equipo registrado.</p>
        )}
        {crud.items.map((member) => (
          <div key={member.id} className="border border-border rounded-lg p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Nombre</Label>
                <Input value={member.nombre} onChange={(e) => crud.updateField(member.id, "nombre", e.target.value)} />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input value={member.cargo || ""} onChange={(e) => crud.updateField(member.id, "cargo", e.target.value)} />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label>Titulación</Label>
                <Input value={member.titulacion || ""} onChange={(e) => crud.updateField(member.id, "titulacion", e.target.value)} />
              </div>
              <div>
                <Label>Años Experiencia</Label>
                <Input type="number" value={member.experiencia_anos || 0} onChange={(e) => crud.updateField(member.id, "experiencia_anos", e.target.value)} />
              </div>
              <div>
                <Label>Especialidad</Label>
                <Select value={member.sector_especialidad || ""} onValueChange={(v) => crud.updateField(member.id, "sector_especialidad", v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{SECTORES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="destructive" onClick={() => crud.remove(member.id)}>
                <Trash2 size={14} />
              </Button>
              <Button size="sm" onClick={() => crud.save(member.id, {
                nombre: member.nombre,
                cargo: member.cargo,
                titulacion: member.titulacion,
                experiencia_anos: member.experiencia_anos ? parseInt(String(member.experiencia_anos)) : 0,
                sector_especialidad: member.sector_especialidad,
              }, "Miembro guardado")}>
                <Save size={14} className="mr-1" />Guardar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
