import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CurrencyInput } from "@/components/ui/currency-input";
import ClaeSelector from "@/components/company/ClaeSelector";
import { Save, Loader2, AlertCircle } from "lucide-react";
import { SECTORES } from "@/data/sectores";
import { companySchema, type CompanyFormData } from "@/schemas/company.schema";
import type { CompanyData } from "@/hooks/useCompanyProfile";

interface GeneralTabProps {
  company: CompanyData;
  saving: boolean;
  currencySymbol: string;
  /** Se llama con los datos validados cuando el usuario guarda */
  onSave: (data: CompanyFormData & { sectores_actividad: string[] }) => void;
  onToggleSector: (sector: string) => void;
}

/** Pequeño componente de error de campo — evita repetición de markup */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-destructive mt-1">
      <AlertCircle size={12} />
      {message}
    </p>
  );
}

/**
 * GeneralTab — Reescrito con React Hook Form + Zod.
 *
 * ANTES: múltiples onChange manuales + sin validación.
 * AHORA: un único objeto de formulario con validación antes de guardar.
 *        Un keystroke en "Razón Social" NO re-renderiza el resto del tab.
 */
export default function GeneralTab({
  company, saving, currencySymbol, onSave, onToggleSector,
}: GeneralTabProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company.name,
      cif: company.cif,
      address: company.address,
      phone: company.phone,
      website: company.website,
      facturacion_anual: company.facturacion_anual,
      patrimonio_neto: company.patrimonio_neto,
      clasificacion_empresarial: company.clasificacion_empresarial,
      capacidad_tecnica: company.capacidad_tecnica,
      capacidad_economica: company.capacidad_economica,
    },
  });

  // Sincroniza el form con los datos cuando la query de React Query los carga
  useEffect(() => {
    reset({
      name: company.name,
      cif: company.cif,
      address: company.address,
      phone: company.phone,
      website: company.website,
      facturacion_anual: company.facturacion_anual,
      patrimonio_neto: company.patrimonio_neto,
      clasificacion_empresarial: company.clasificacion_empresarial,
      capacidad_tecnica: company.capacidad_tecnica,
      capacidad_economica: company.capacidad_economica,
    });
  }, [company.name, reset]); // Solo cuando name cambia = nuevo company cargado

  const onSubmit = (data: CompanyFormData) => {
    onSave({ ...data, sectores_actividad: company.sectores_actividad });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos Generales</CardTitle>
        <CardDescription>Información fiscal y financiera</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Identificación */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Razón Social *</Label>
              <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <Label htmlFor="cif">CIF/CUIT</Label>
              <Input id="cif" {...register("cif")} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" {...register("address")} />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" {...register("phone")} aria-invalid={!!errors.phone} />
              <FieldError message={errors.phone?.message} />
            </div>
          </div>

          <div>
            <Label htmlFor="website">Sitio Web</Label>
            <Input id="website" {...register("website")} placeholder="https://miempresa.com" aria-invalid={!!errors.website} />
            <FieldError message={errors.website?.message} />
          </div>

          {/* Datos financieros */}
          <div className="border-t border-border pt-4 mt-4">
            <h3 className="font-semibold mb-3">Datos Financieros</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Facturación Anual ({currencySymbol})</Label>
                <Controller
                  name="facturacion_anual"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput value={field.value ?? ""} onChange={field.onChange} />
                  )}
                />
              </div>
              <div>
                <Label>Patrimonio Neto ({currencySymbol})</Label>
                <Controller
                  name="patrimonio_neto"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput value={field.value ?? ""} onChange={field.onChange} />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Clasificación */}
          <div className="border-t border-border pt-4 mt-4">
            <h3 className="font-semibold mb-3">Clasificación y Capacidad</h3>
            <div>
              <Label>Clasificación Empresarial (CLAE - ARCA)</Label>
              <Controller
                name="clasificacion_empresarial"
                control={control}
                render={({ field }) => (
                  <ClaeSelector value={field.value ?? ""} onChange={field.onChange} />
                )}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-3">
              <div>
                <Label htmlFor="capacidad_tecnica">Capacidad Técnica</Label>
                <Textarea id="capacidad_tecnica" {...register("capacidad_tecnica")} placeholder="Medios técnicos disponibles" />
              </div>
              <div>
                <Label htmlFor="capacidad_economica">Capacidad Económica</Label>
                <Textarea id="capacidad_economica" {...register("capacidad_economica")} placeholder="Capacidad financiera" />
              </div>
            </div>
          </div>

          {/* Sectores (se manejan fuera del form via toggle) */}
          <div className="border-t border-border pt-4 mt-4">
            <h3 className="font-semibold mb-3">Sectores de Actividad</h3>
            <div className="flex flex-wrap gap-2">
              {SECTORES.map((s) => (
                <Badge
                  key={s}
                  variant={company.sectores_actividad.includes(s) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => onToggleSector(s)}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full mt-4">
            {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
            Guardar Datos
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
