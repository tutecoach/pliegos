import { useState, useEffect } from "react";
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

const AI_MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Rápido)" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Preciso)" },
  { value: "gpt-5-mini", label: "GPT-5 Mini (Equilibrado)" },
  { value: "gpt-5", label: "GPT-5 (Máxima calidad)" },
];

const Settings = () => {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const [reportFormat, setReportFormat] = useState("detailed");
  const [autoSector, setAutoSector] = useState(true);
  const [aiModel, setAiModel] = useState("gemini-2.5-flash");
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("profiles").select("full_name, plan_tier, company_id").eq("user_id", user.id).single();
      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
      }
      const { data: roleCheck } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!roleCheck);
    };
    load();
    const savedFormat = localStorage.getItem("pliego-smart-report-format");
    if (savedFormat) setReportFormat(savedFormat);
    const savedAutoSector = localStorage.getItem("pliego-smart-auto-sector");
    if (savedAutoSector !== null) setAutoSector(savedAutoSector === "true");
    const savedAiModel = localStorage.getItem("pliego-smart-ai-model");
    if (savedAiModel) setAiModel(savedAiModel);
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil actualizado" });
    }
  };

  const savePreference = (key: string, value: string) => {
    localStorage.setItem(`pliego-smart-${key}`, value);
    toast({ title: "Preferencia guardada" });
  };

  const planLabel = (tier: string) => {
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
                <Badge variant="secondary" className="text-sm">{planLabel(profile?.plan_tier)}</Badge>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveProfile} disabled={saving} size="sm">
                  {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
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
                <Select value={reportFormat} onValueChange={(v) => { setReportFormat(v); savePreference("report-format", v); }}>
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
                <Switch checked={autoSector} onCheckedChange={(v) => { setAutoSector(v); savePreference("auto-sector", String(v)); }} />
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
                <Select value={aiModel} onValueChange={(v) => { setAiModel(v); savePreference("ai-model", v); }}>
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
          {/* User Management - only for admins */}
          {isAdmin && <UserManagement />}
          {isAdmin && <DemoRequestsManagement />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
