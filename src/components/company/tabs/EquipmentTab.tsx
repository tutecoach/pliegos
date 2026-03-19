import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Plus, Save, Trash2 } from "lucide-react";
import type { Equipment } from "@/hooks/useCompanyProfile";
import type { useEntityCrud } from "@/hooks/useEntityCrud";

const EQUIPMENT_TYPES = [
  { value: "maquinaria", label: "Maquinaria" },
  { value: "vehiculo", label: "Vehículo / Movilidad" },
  { value: "herramienta", label: "Herramienta" },
  { value: "tecnologia", label: "Tecnología / Software" },
  { value: "infraestructura", label: "Infraestructura" },
  { value: "otro", label: "Otro" },
];

interface EquipmentTabProps {
  crud: ReturnType<typeof useEntityCrud<Equipment>>;
}

export default function EquipmentTab({ crud }: EquipmentTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Truck size={18} /> Equipamiento e Infraestructura</CardTitle>
          <CardDescription>Maquinaria, vehículos y recursos materiales</CardDescription>
        </div>
        <Button size="sm" onClick={() => crud.add({ nombre: "Nuevo equipo", tipo: "maquinaria" }, true)}>
          <Plus size={14} className="mr-1" />Añadir
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {crud.items.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">
            Sin equipamiento registrado. Añade maquinaria, vehículos u otros recursos.
          </p>
        )}
        {crud.items.map((eq) => (
          <div key={eq.id} className="border border-border rounded-lg p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Nombre</Label>
                <Input value={eq.nombre} onChange={(e) => crud.updateField(eq.id, "nombre", e.target.value)} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={eq.tipo || "maquinaria"} onValueChange={(v) => crud.updateField(eq.id, "tipo", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Cantidad</Label>
                <Input type="number" min={1} value={eq.cantidad || 1} onChange={(e) => crud.updateField(eq.id, "cantidad", e.target.value)} />
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={eq.estado || "operativo"} onValueChange={(v) => crud.updateField(eq.id, "estado", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operativo">Operativo</SelectItem>
                    <SelectItem value="mantenimiento">En mantenimiento</SelectItem>
                    <SelectItem value="fuera_servicio">Fuera de servicio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={eq.descripcion || ""} onChange={(e) => crud.updateField(eq.id, "descripcion", e.target.value)} placeholder="Modelo, características, capacidad..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="destructive" onClick={() => crud.remove(eq.id)}>
                <Trash2 size={14} />
              </Button>
              <Button size="sm" onClick={() => crud.save(eq.id, {
                nombre: eq.nombre,
                tipo: eq.tipo,
                descripcion: eq.descripcion,
                cantidad: eq.cantidad ? parseInt(String(eq.cantidad)) : 1,
                estado: eq.estado,
              }, "Equipamiento guardado")}>
                <Save size={14} className="mr-1" />Guardar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
