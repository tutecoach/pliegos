import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Award, Plus, Save, Trash2 } from "lucide-react";
import type { Certification } from "@/hooks/useCompanyProfile";
import type { useEntityCrud } from "@/hooks/useEntityCrud";

interface CertificationsTabProps {
  crud: ReturnType<typeof useEntityCrud<Certification>>;
}

export default function CertificationsTab({ crud }: CertificationsTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Award size={18} /> Certificaciones</CardTitle>
          <CardDescription>ISO, OHSAS, habilitaciones técnicas</CardDescription>
        </div>
        <Button size="sm" onClick={() => crud.add({ nombre: "Nueva certificación" })}>
          <Plus size={14} className="mr-1" />Añadir
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {crud.items.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">
            Sin certificaciones. Añade una para mejorar tu matching.
          </p>
        )}
        {crud.items.map((cert) => (
          <div key={cert.id} className="border border-border rounded-lg p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Nombre</Label>
                <Input value={cert.nombre} onChange={(e) => crud.updateField(cert.id, "nombre", e.target.value)} />
              </div>
              <div>
                <Label>Organismo Emisor</Label>
                <Input value={cert.organismo_emisor || ""} onChange={(e) => crud.updateField(cert.id, "organismo_emisor", e.target.value)} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Fecha Obtención</Label>
                <Input type="date" value={cert.fecha_obtencion || ""} onChange={(e) => crud.updateField(cert.id, "fecha_obtencion", e.target.value)} />
              </div>
              <div>
                <Label>Fecha Vencimiento</Label>
                <Input type="date" value={cert.fecha_vencimiento || ""} onChange={(e) => crud.updateField(cert.id, "fecha_vencimiento", e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="destructive" onClick={() => crud.remove(cert.id)}>
                <Trash2 size={14} />
              </Button>
              <Button size="sm" onClick={() => crud.save(cert.id, {
                nombre: cert.nombre,
                organismo_emisor: cert.organismo_emisor,
                fecha_obtencion: cert.fecha_obtencion || null,
                fecha_vencimiento: cert.fecha_vencimiento || null,
                puntuable: cert.puntuable,
              }, "Certificación guardada")}>
                <Save size={14} className="mr-1" />Guardar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
