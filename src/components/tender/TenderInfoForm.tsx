import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { AlertCircle, Building2 } from "lucide-react";
import { SECTORES } from "@/data/sectores";
import { tenderSchema, type TenderFormData } from "@/schemas/tender.schema";

interface TenderInfoFormProps {
  defaultValues: TenderFormData;
  projects: { id: string; name: string }[];
  allCompanies: { id: string; name: string }[];
  companyId: string | null;
  planTier: string;
  currencySymbol: string;
  onSubmit: (data: TenderFormData) => void;
  onCompanySwitch: (id: string) => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-destructive mt-1">
      <AlertCircle size={12} />{message}
    </p>
  );
}

/**
 * TenderInfoForm — Formulario del paso "info" de NewAnalysis.
 * 
 * ANTES: inputs controlados manualmente en NewAnalysis (setState por campo).
 * AHORA: react-hook-form con zodResolver. Un único handleSubmit valida antes de crear el tender.
 */
export default function TenderInfoForm({
  defaultValues, projects, allCompanies, companyId, planTier, currencySymbol, onSubmit, onCompanySwitch,
}: TenderInfoFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TenderFormData>({
    resolver: zodResolver(tenderSchema),
    defaultValues,
  });

  // Sincroniza cuando el projectId por defecto llega (async desde useNewAnalysis)
  useEffect(() => {
    if (defaultValues.projectId) reset(defaultValues);
  }, [defaultValues.projectId, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  const sym = currencySymbol;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos de la Licitación</CardTitle>
        <CardDescription>Información del pliego. Los campos con * son obligatorios.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Multi-empresa enterprise */}
          {allCompanies.length > 1 && planTier === "enterprise" && (
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
              <Label className="flex items-center gap-2 font-semibold">
                <Building2 size={16} className="text-primary" /> Empresa para el análisis *
              </Label>
              <Select value={companyId || ""} onValueChange={onCompanySwitch}>
                <SelectTrigger><SelectValue placeholder="Seleccionar empresa" /></SelectTrigger>
                <SelectContent>
                  {allCompanies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2"><Building2 size={14} /> {c.name}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Título */}
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input id="title" placeholder="Ej: Servicio de limpieza del Ayuntamiento" {...register("title")} aria-invalid={!!errors.title} />
            <FieldError message={errors.title?.message} />
          </div>

          {/* Entidad */}
          <div>
            <Label htmlFor="contractingEntity">Entidad contratante</Label>
            <Input id="contractingEntity" placeholder="Ej: Ayuntamiento de Madrid" {...register("contractingEntity")} />
          </div>

          {/* Importes */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Presupuesto base ({sym})</Label>
              <Controller name="contractAmount" control={control} render={({ field }) => (
                <CurrencyInput value={field.value ?? ""} onChange={field.onChange} />
              )} />
              <FieldError message={errors.contractAmount?.message} />
            </div>
            <div>
              <Label>Valor estimado ({sym})</Label>
              <Controller name="valorEstimado" control={control} render={({ field }) => (
                <CurrencyInput value={field.value ?? ""} onChange={field.onChange} />
              )} />
              <FieldError message={errors.valorEstimado?.message} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duración</Label>
              <Input id="duration" placeholder="Ej: 24 meses" {...register("duration")} />
            </div>
            <div>
              <Label htmlFor="deadline">Fecha límite presentación</Label>
              <Input id="deadline" type="datetime-local" {...register("deadline")} />
            </div>
          </div>

          {/* Garantías */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Garantía provisional ({sym})</Label>
              <Controller name="garantiaProv" control={control} render={({ field }) => (
                <CurrencyInput value={field.value ?? ""} onChange={field.onChange} />
              )} />
              <FieldError message={errors.garantiaProv?.message} />
            </div>
            <div>
              <Label>Garantía definitiva ({sym})</Label>
              <Controller name="garantiaDef" control={control} render={({ field }) => (
                <CurrencyInput value={field.value ?? ""} onChange={field.onChange} />
              )} />
              <FieldError message={errors.garantiaDef?.message} />
            </div>
          </div>

          {/* Clasificación + Sector */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clasificacionReq">Clasificación requerida</Label>
              <Input id="clasificacionReq" placeholder="Ej: Grupo C, Subgrupo 6" {...register("clasificacionReq")} />
            </div>
            <div>
              <Label>Sector (auto-detectado por IA)</Label>
              <Controller name="sector" control={control} render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Auto-detectar" /></SelectTrigger>
                  <SelectContent>{SECTORES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
          </div>

          {/* Proyecto (visible solo si hay más de uno) */}
          {projects.length > 1 && (
            <div>
              <Label>Proyecto *</Label>
              <Controller name="projectId" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              <FieldError message={errors.projectId?.message} />
            </div>
          )}

          <Button type="submit" className="w-full mt-2">Continuar a Documentos</Button>
        </form>
      </CardContent>
    </Card>
  );
}
