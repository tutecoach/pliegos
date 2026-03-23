import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, type AppLanguage } from "@/contexts/LanguageContext";
import { useCurrency, CURRENCY_OPTIONS, type CurrencyCode } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import UserManagement from "@/components/settings/UserManagement";
import DemoRequestsManagement from "@/components/settings/DemoRequestsManagement";
import { toast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Loader2, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProfileQuery } from "@/hooks/queries/useCompanyQueries";
import { queryKeys } from "@/hooks/queries/query-keys";

const AI_MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Rápido)" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Preciso)" },
  { value: "gpt-5-mini", label: "GPT-5 Mini (Equilibrado)" },
  { value: "gpt-5", label: "GPT-5 (Máxima calidad)" },
];

// ─── Local preferences (no necesitan React Query, son valores en localStorage) ─

function getLocalPref(key: string, fallback: string): string {
  return localStorage.getItem(`pliego-smart-${key}`) ?? fallback;
}

function setLocalPref(key: string, value: string): void {
  localStorage.setItem(`pliego-smart-${key}`, value);
  toast({ title: "Preferencia guardada" });
}

// ─── Settings ────────────────────────────────────────────────────────────────

/**
 * Settings — Migrado a React Query.
 *
 * ANTES: useState + useEffect + supabase manual para perfil y admin check.
 * AHORA: useProfileQuery + useQuery para admin check. Sin useEffect.
 */
const Settings = () => {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const queryClient = useQueryClient();

  // React Query: perfil (reutilizamos el mismo hook que Dashboard)
  const { data: profile } = useProfileQuery(user?.id);

  // React Query: check admin role
  const { data: isAdmin = false } = useQuery({
    queryKey: ["is-admin", user?.id ?? ""],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      return !!data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Estado local para el nombre (editable)
  const [fullName, setFullName] = useState(profile?.full_name || "");
  // Sync nombre cuando el perfil carga (solo una vez)
  if (profile?.full_name && fullName === "") {
    setFullName(profile.full_name);
  }

  // Local preferences (sin servidor)
  const [reportFormat, setReportFormat] = useState(() => getLocalPref("report-format", "detailed"));
  const [autoSector, setAutoSector] = useState(() => getLocalPref("auto-sector", "true") === "true");
  const [aiModel, setAiModel] = useState(() => getLocalPref("ai-model", "gemini-2.5-flash"));

  // Mutation: guardar perfil
  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(user?.id ?? "") });
      toast({ title: "Perfil actualizado" });
    },
    onError: (err: Error) => {
      toast({ title: "Error al guardar", description: err.message, variant: "destructive" });
    },
  });

  const planLabel = (tier: string | null) => {
    switch (tier) {
      case "professional": return "Professional";
      case "enterprise": return "Enterprise";
      default: return "Starter";
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <SettingsIcon size={24} className="text-primary" /> Configuración
        </h1>

        <div className="space-y-6">
          {/* Cuenta */}
          <Card>
            <CardHeader>
              <CardTitle>Cuenta</CardTitle>
              <CardDescription>Información de tu cuenta y perfil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="mt-1 bg-muted" />
              </div>
              <div>
                <Label>Nombre completo</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Plan actual</Label>
                  <p className="text-sm text-muted-foreground mt-0.5">Tu nivel de suscripción</p>
                </div>
                <Badge variant="secondary" className="text-sm">{planLabel(profile?.plan_tier ?? null)}</Badge>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => saveProfileMutation.mutate()} disabled={saveProfileMutation.isPending} size="sm">
                  {saveProfileMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
                  Guardar perfil
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preferencias Generales */}
          <Card>
            <CardHeader>
              <CardTitle>Preferencias Generales</CardTitle>
              <CardDescription>Configura el comportamiento de la aplicación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Idioma</Label>
                  <p className="text-sm text-muted-foreground">Idioma de la interfaz y los informes</p>
                </div>
                <Select value={language} onValueChange={(v) => setLanguage(v as AppLanguage)}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Moneda</Label>
                  <p className="text-sm text-muted-foreground">Moneda para mostrar importes y presupuestos</p>
                </div>
                <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
                  <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map(o => (
                      <SelectItem key={o.code} value={o.code}>
                        {o.symbol} {o.label} ({o.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Formato de Informes</Label>
                  <p className="text-sm text-muted-foreground">Nivel de detalle en los informes generados</p>
                </div>
                <Select value={reportFormat} onValueChange={(v) => { setReportFormat(v); setLocalPref("report-format", v); }}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Resumen</SelectItem>
                    <SelectItem value="detailed">Detallado</SelectItem>
                    <SelectItem value="executive">Ejecutivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Detección automática de sector</Label>
                  <p className="text-sm text-muted-foreground">La IA detecta el sector del pliego automáticamente</p>
                </div>
                <Switch checked={autoSector} onCheckedChange={(v) => { setAutoSector(v); setLocalPref("auto-sector", String(v)); }} />
              </div>
            </CardContent>
          </Card>

          {/* IA */}
          <Card>
            <CardHeader>
              <CardTitle>Modelo de IA</CardTitle>
              <CardDescription>Elige el modelo de IA para análisis y memorias técnicas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Modelo preferido</Label>
                  <p className="text-sm text-muted-foreground">Modelos más potentes pueden tardar más</p>
                </div>
                <Select value={aiModel} onValueChange={(v) => { setAiModel(v); setLocalPref("ai-model", v); }}>
                  <SelectTrigger className="w-[240px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Admin panels */}
          {isAdmin && <UserManagement />}
          {isAdmin && <DemoRequestsManagement />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
