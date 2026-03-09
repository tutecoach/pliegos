import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Settings as SettingsIcon } from "lucide-react";

const Settings = () => {
  const { user } = useAuth();
  const [language, setLanguage] = useState("es");
  const [reportFormat, setReportFormat] = useState("detailed");
  const [autoSector, setAutoSector] = useState(true);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <SettingsIcon size={24} className="text-primary" /> Configuración
        </h1>

        <div className="space-y-6">
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
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Formato de Informes</Label>
                  <p className="text-sm text-muted-foreground">Nivel de detalle en los informes generados</p>
                </div>
                <Select value={reportFormat} onValueChange={setReportFormat}>
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
                <Switch checked={autoSector} onCheckedChange={setAutoSector} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cuenta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm"><span className="text-muted-foreground">Email:</span> {user?.email}</p>
                <p className="text-sm"><span className="text-muted-foreground">Plan:</span> Starter</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
