import { Loader2, Building2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CompanySwitcher from "@/components/company/CompanySwitcher";
import GeneralTab from "@/components/company/tabs/GeneralTab";
import CertificationsTab from "@/components/company/tabs/CertificationsTab";
import ExperienceTab from "@/components/company/tabs/ExperienceTab";
import TeamTab from "@/components/company/tabs/TeamTab";
import EquipmentTab from "@/components/company/tabs/EquipmentTab";
import { useCompanyProfile } from "@/hooks/useCompanyProfile";

/**
 * CompanyProfile — Orquestador.
 * 
 * ANTES: 479 líneas con lógica, UI y llamadas a Supabase mezcladas.
 * AHORA: <60 líneas que solo orquestan tabs y delegan responsabilidades.
 * 
 * Lógica → useCompanyProfile.ts
 * Operaciones CRUD → useEntityCrud.ts (por cada entidad)
 * UI por sección → components/company/tabs/*
 */
const CompanyProfile = () => {
  const {
    user, loading, saving, companyId, planTier,
    company, setCompany, currencySymbol,
    saveCompany, toggleSector, handleCompanySwitch,
    certifications, experience, team, equipment,
  } = useCompanyProfile();

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 size={24} className="text-primary" /> Perfil de Empresa
            </h1>
            <p className="text-muted-foreground text-sm">Datos para el matching automático con pliegos</p>
          </div>
          {planTier === "enterprise" && user && (
            <CompanySwitcher
              userId={user.id}
              currentCompanyId={companyId}
              onSwitch={handleCompanySwitch}
            />
          )}
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="certifications">Certificaciones</TabsTrigger>
            <TabsTrigger value="experience">Experiencia</TabsTrigger>
            <TabsTrigger value="team">Equipo</TabsTrigger>
            <TabsTrigger value="equipment">Equipamiento</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralTab
              company={company}
              saving={saving}
              currencySymbol={currencySymbol}
              onSave={saveCompany}
              onToggleSector={toggleSector}
            />
          </TabsContent>
          <TabsContent value="certifications">
            <CertificationsTab crud={certifications} />
          </TabsContent>
          <TabsContent value="experience">
            <ExperienceTab crud={experience} currencySymbol={currencySymbol} />
          </TabsContent>
          <TabsContent value="team">
            <TeamTab crud={team} />
          </TabsContent>
          <TabsContent value="equipment">
            <EquipmentTab crud={equipment} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CompanyProfile;
