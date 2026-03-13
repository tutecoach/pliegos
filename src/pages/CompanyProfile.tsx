import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { ensureCompanySetupForUser } from "@/lib/company-setup";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CompanySwitcher from "@/components/company/CompanySwitcher";
import ClaeSelector from "@/components/company/ClaeSelector";
import { Building2, Save, Plus, Trash2, Award, Users, Briefcase, Loader2, Truck } from "lucide-react";

const SECTORES = [
  "Obras Civiles", "Energía", "Agua y Saneamiento", "Tecnología",
  "Sanidad", "Servicios Generales", "Industrial", "Transporte",
  "Telecomunicaciones", "Ambiental", "Arquitectura", "Facility Management",
];

const EQUIPMENT_TYPES = [
  { value: "maquinaria", label: "Maquinaria" },
  { value: "vehiculo", label: "Vehículo / Movilidad" },
  { value: "herramienta", label: "Herramienta" },
  { value: "tecnologia", label: "Tecnología / Software" },
  { value: "infraestructura", label: "Infraestructura" },
  { value: "otro", label: "Otro" },
];

const CompanyProfile = () => {
  const { user } = useAuth();
  const { currencyOption } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [planTier, setPlanTier] = useState<string>("starter");

  const [company, setCompany] = useState({
    name: "", cif: "", address: "", phone: "", website: "",
    facturacion_anual: "", patrimonio_neto: "", clasificacion_empresarial: "",
    capacidad_tecnica: "", capacidad_economica: "",
    sectores_actividad: [] as string[],
  });

  const [certifications, setCertifications] = useState<any[]>([]);
  const [experience, setExperience] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);

  const loadCompanyData = async (cId: string) => {
    const [compRes, certRes, expRes, teamRes, equipRes] = await Promise.all([
      supabase.from("companies").select("*").eq("id", cId).single(),
      supabase.from("company_certifications").select("*").eq("company_id", cId),
      supabase.from("company_experience").select("*").eq("company_id", cId).order("fecha_inicio", { ascending: false }),
      supabase.from("company_team").select("*").eq("company_id", cId),
      supabase.from("company_equipment").select("*").eq("company_id", cId).order("created_at", { ascending: false }),
    ]);

    if (compRes.data) {
      const c = compRes.data as any;
      setCompany({
        name: c.name || "", cif: c.cif || "", address: c.address || "",
        phone: c.phone || "", website: c.website || "",
        facturacion_anual: c.facturacion_anual?.toString() || "",
        patrimonio_neto: c.patrimonio_neto?.toString() || "",
        clasificacion_empresarial: c.clasificacion_empresarial || "",
        capacidad_tecnica: c.capacidad_tecnica || "",
        capacidad_economica: c.capacidad_economica || "",
        sectores_actividad: c.sectores_actividad || [],
      });
    }

    setCertifications(certRes.data || []);
    setExperience(expRes.data || []);
    setTeam(teamRes.data || []);
    setEquipment(equipRes.data || []);
  };

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const { companyId: ensuredCompanyId } = await ensureCompanySetupForUser(user.id);
        setCompanyId(ensuredCompanyId);

        const { data: profile } = await supabase.from("profiles").select("plan_tier").eq("user_id", user.id).single();
        if (profile) setPlanTier(profile.plan_tier);

        await loadCompanyData(ensuredCompanyId);
      } catch (error: any) {
        toast({ title: "Error de configuración", description: error?.message || "No se pudo inicializar la empresa", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleCompanySwitch = async (newCompanyId: string) => {
    setCompanyId(newCompanyId);
    setLoading(true);
    try {
      // Update profile to point to new active company
      await supabase.from("profiles").update({ company_id: newCompanyId }).eq("user_id", user!.id);
      await loadCompanyData(newCompanyId);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const sym = currencyOption.symbol;

  const saveCompany = async () => {
    if (!companyId) { toast({ title: "No hay empresa vinculada", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("companies").update({
      name: company.name, cif: company.cif, address: company.address,
      phone: company.phone, website: company.website,
      facturacion_anual: company.facturacion_anual ? parseFloat(company.facturacion_anual) : null,
      patrimonio_neto: company.patrimonio_neto ? parseFloat(company.patrimonio_neto) : null,
      clasificacion_empresarial: company.clasificacion_empresarial || null,
      capacidad_tecnica: company.capacidad_tecnica || null,
      capacidad_economica: company.capacidad_economica || null,
      sectores_actividad: company.sectores_actividad,
    }).eq("id", companyId);
    setSaving(false);
    if (error) toast({ title: "Error guardando", description: error.message, variant: "destructive" });
    else toast({ title: "✅ Empresa actualizada correctamente" });
  };

  const toggleSector = (s: string) => {
    setCompany(prev => ({
      ...prev,
      sectores_actividad: prev.sectores_actividad.includes(s)
        ? prev.sectores_actividad.filter(x => x !== s)
        : [...prev.sectores_actividad, s],
    }));
  };

  // Certifications CRUD
  const addCertification = async () => {
    if (!companyId) return;
    const { data, error } = await supabase.from("company_certifications")
      .insert({ company_id: companyId, nombre: "Nueva certificación" }).select().single();
    if (data) setCertifications(prev => [...prev, data]);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
  };
  const updateCertification = (id: string, field: string, value: any) => {
    setCertifications(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };
  const saveCertification = async (cert: any) => {
    const { error } = await supabase.from("company_certifications")
      .update({ nombre: cert.nombre, organismo_emisor: cert.organismo_emisor, fecha_obtencion: cert.fecha_obtencion || null, fecha_vencimiento: cert.fecha_vencimiento || null, puntuable: cert.puntuable })
      .eq("id", cert.id);
    if (error) toast({ title: "Error", variant: "destructive" });
    else toast({ title: "Certificación guardada" });
  };
  const deleteCertification = async (id: string) => {
    await supabase.from("company_certifications").delete().eq("id", id);
    setCertifications(prev => prev.filter(c => c.id !== id));
  };

  // Experience CRUD
  const addExperience = async () => {
    if (!companyId) return;
    const { data, error } = await supabase.from("company_experience")
      .insert({ company_id: companyId, titulo: "Nueva experiencia" }).select().single();
    if (data) setExperience(prev => [data, ...prev]);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
  };
  const updateExperience = (id: string, field: string, value: any) => {
    setExperience(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };
  const saveExperience = async (exp: any) => {
    const { error } = await supabase.from("company_experience")
      .update({ titulo: exp.titulo, cliente: exp.cliente, sector: exp.sector, importe: exp.importe ? parseFloat(exp.importe) : null, fecha_inicio: exp.fecha_inicio || null, fecha_fin: exp.fecha_fin || null, descripcion: exp.descripcion, resultado: exp.resultado })
      .eq("id", exp.id);
    if (error) toast({ title: "Error", variant: "destructive" });
    else toast({ title: "Experiencia guardada" });
  };
  const deleteExperience = async (id: string) => {
    await supabase.from("company_experience").delete().eq("id", id);
    setExperience(prev => prev.filter(e => e.id !== id));
  };

  // Team CRUD
  const addTeamMember = async () => {
    if (!companyId) return;
    const { data, error } = await supabase.from("company_team")
      .insert({ company_id: companyId, nombre: "Nuevo miembro" }).select().single();
    if (data) setTeam(prev => [...prev, data]);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
  };
  const updateTeamMember = (id: string, field: string, value: any) => {
    setTeam(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };
  const saveTeamMember = async (member: any) => {
    const { error } = await supabase.from("company_team")
      .update({ nombre: member.nombre, cargo: member.cargo, titulacion: member.titulacion, experiencia_anos: member.experiencia_anos ? parseInt(member.experiencia_anos) : 0, sector_especialidad: member.sector_especialidad })
      .eq("id", member.id);
    if (error) toast({ title: "Error", variant: "destructive" });
    else toast({ title: "Miembro guardado" });
  };
  const deleteTeamMember = async (id: string) => {
    await supabase.from("company_team").delete().eq("id", id);
    setTeam(prev => prev.filter(t => t.id !== id));
  };

  // Equipment CRUD
  const addEquipment = async () => {
    if (!companyId) return;
    const { data, error } = await supabase.from("company_equipment")
      .insert({ company_id: companyId, nombre: "Nuevo equipo", tipo: "maquinaria" }).select().single();
    if (data) setEquipment(prev => [data, ...prev]);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
  };
  const updateEquipment = (id: string, field: string, value: any) => {
    setEquipment(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };
  const saveEquipment = async (eq: any) => {
    const { error } = await supabase.from("company_equipment")
      .update({ nombre: eq.nombre, tipo: eq.tipo, descripcion: eq.descripcion, cantidad: eq.cantidad ? parseInt(eq.cantidad) : 1, estado: eq.estado })
      .eq("id", eq.id);
    if (error) toast({ title: "Error", variant: "destructive" });
    else toast({ title: "Equipamiento guardado" });
  };
  const deleteEquipment = async (id: string) => {
    await supabase.from("company_equipment").delete().eq("id", id);
    setEquipment(prev => prev.filter(e => e.id !== id));
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 size={24} className="text-primary" /> Perfil de Empresa</h1>
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

          {/* General Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader><CardTitle>Datos Generales</CardTitle><CardDescription>Información fiscal y financiera</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><Label>Razón Social *</Label><Input value={company.name} onChange={e => setCompany(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><Label>CIF/CUIT</Label><Input value={company.cif} onChange={e => setCompany(p => ({ ...p, cif: e.target.value }))} /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><Label>Dirección</Label><Input value={company.address} onChange={e => setCompany(p => ({ ...p, address: e.target.value }))} /></div>
                  <div><Label>Teléfono</Label><Input value={company.phone} onChange={e => setCompany(p => ({ ...p, phone: e.target.value }))} /></div>
                </div>
                <div><Label>Sitio Web</Label><Input value={company.website} onChange={e => setCompany(p => ({ ...p, website: e.target.value }))} /></div>

                <div className="border-t border-border pt-4 mt-4">
                  <h3 className="font-semibold mb-3">Datos Financieros</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><Label>Facturación Anual ({sym})</Label><CurrencyInput value={company.facturacion_anual} onChange={v => setCompany(p => ({ ...p, facturacion_anual: v }))} /></div>
                    <div><Label>Patrimonio Neto ({sym})</Label><CurrencyInput value={company.patrimonio_neto} onChange={v => setCompany(p => ({ ...p, patrimonio_neto: v }))} /></div>
                  </div>
                </div>

                <div className="border-t border-border pt-4 mt-4">
                  <h3 className="font-semibold mb-3">Clasificación y Capacidad</h3>
                  <div><Label>Clasificación Empresarial</Label><Input placeholder="Ej: Grupo C, Subgrupo 6, Categoría D" value={company.clasificacion_empresarial} onChange={e => setCompany(p => ({ ...p, clasificacion_empresarial: e.target.value }))} /></div>
                  <div className="grid sm:grid-cols-2 gap-4 mt-3">
                    <div><Label>Capacidad Técnica</Label><Textarea value={company.capacidad_tecnica} onChange={e => setCompany(p => ({ ...p, capacidad_tecnica: e.target.value }))} placeholder="Medios técnicos disponibles" /></div>
                    <div><Label>Capacidad Económica</Label><Textarea value={company.capacidad_economica} onChange={e => setCompany(p => ({ ...p, capacidad_economica: e.target.value }))} placeholder="Capacidad financiera" /></div>
                  </div>
                </div>

                <div className="border-t border-border pt-4 mt-4">
                  <h3 className="font-semibold mb-3">Sectores de Actividad</h3>
                  <div className="flex flex-wrap gap-2">
                    {SECTORES.map(s => (
                      <Badge key={s} variant={company.sectores_actividad.includes(s) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleSector(s)}>{s}</Badge>
                    ))}
                  </div>
                </div>

                <Button onClick={saveCompany} disabled={saving} className="w-full mt-4">
                  {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                  Guardar Datos
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certifications Tab */}
          <TabsContent value="certifications">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle className="flex items-center gap-2"><Award size={18} /> Certificaciones</CardTitle><CardDescription>ISO, OHSAS, habilitaciones técnicas</CardDescription></div>
                <Button size="sm" onClick={addCertification}><Plus size={14} className="mr-1" />Añadir</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {certifications.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">Sin certificaciones. Añade una para mejorar tu matching.</p>}
                {certifications.map(cert => (
                  <div key={cert.id} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div><Label>Nombre</Label><Input value={cert.nombre} onChange={e => updateCertification(cert.id, "nombre", e.target.value)} /></div>
                      <div><Label>Organismo Emisor</Label><Input value={cert.organismo_emisor || ""} onChange={e => updateCertification(cert.id, "organismo_emisor", e.target.value)} /></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div><Label>Fecha Obtención</Label><Input type="date" value={cert.fecha_obtencion || ""} onChange={e => updateCertification(cert.id, "fecha_obtencion", e.target.value)} /></div>
                      <div><Label>Fecha Vencimiento</Label><Input type="date" value={cert.fecha_vencimiento || ""} onChange={e => updateCertification(cert.id, "fecha_vencimiento", e.target.value)} /></div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="destructive" onClick={() => deleteCertification(cert.id)}><Trash2 size={14} /></Button>
                      <Button size="sm" onClick={() => saveCertification(cert)}><Save size={14} className="mr-1" />Guardar</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Experience Tab */}
          <TabsContent value="experience">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle className="flex items-center gap-2"><Briefcase size={18} /> Obras / Proyectos Ejecutados</CardTitle><CardDescription>Experiencia previa para matching</CardDescription></div>
                <Button size="sm" onClick={addExperience}><Plus size={14} className="mr-1" />Añadir</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {experience.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">Sin experiencias registradas.</p>}
                {experience.map(exp => (
                  <div key={exp.id} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div><Label>Título</Label><Input value={exp.titulo} onChange={e => updateExperience(exp.id, "titulo", e.target.value)} /></div>
                      <div><Label>Cliente</Label><Input value={exp.cliente || ""} onChange={e => updateExperience(exp.id, "cliente", e.target.value)} /></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <Label>Sector</Label>
                        <Select value={exp.sector || ""} onValueChange={v => updateExperience(exp.id, "sector", v)}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>{SECTORES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Importe ({sym})</Label><CurrencyInput value={exp.importe?.toString() || ""} onChange={v => updateExperience(exp.id, "importe", v)} /></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div><Label>Fecha Inicio</Label><Input type="date" value={exp.fecha_inicio || ""} onChange={e => updateExperience(exp.id, "fecha_inicio", e.target.value)} /></div>
                      <div><Label>Fecha Culminación</Label><Input type="date" value={exp.fecha_fin || ""} onChange={e => updateExperience(exp.id, "fecha_fin", e.target.value)} /></div>
                    </div>
                    <div><Label>Descripción</Label><Textarea value={exp.descripcion || ""} onChange={e => updateExperience(exp.id, "descripcion", e.target.value)} /></div>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="destructive" onClick={() => deleteExperience(exp.id)}><Trash2 size={14} /></Button>
                      <Button size="sm" onClick={() => saveExperience(exp)}><Save size={14} className="mr-1" />Guardar</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle className="flex items-center gap-2"><Users size={18} /> Equipo Técnico</CardTitle><CardDescription>Personal clave para licitaciones</CardDescription></div>
                <Button size="sm" onClick={addTeamMember}><Plus size={14} className="mr-1" />Añadir</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {team.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">Sin equipo registrado.</p>}
                {team.map(member => (
                  <div key={member.id} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div><Label>Nombre</Label><Input value={member.nombre} onChange={e => updateTeamMember(member.id, "nombre", e.target.value)} /></div>
                      <div><Label>Cargo</Label><Input value={member.cargo || ""} onChange={e => updateTeamMember(member.id, "cargo", e.target.value)} /></div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div><Label>Titulación</Label><Input value={member.titulacion || ""} onChange={e => updateTeamMember(member.id, "titulacion", e.target.value)} /></div>
                      <div><Label>Años Experiencia</Label><Input type="number" value={member.experiencia_anos || 0} onChange={e => updateTeamMember(member.id, "experiencia_anos", e.target.value)} /></div>
                      <div>
                        <Label>Especialidad</Label>
                        <Select value={member.sector_especialidad || ""} onValueChange={v => updateTeamMember(member.id, "sector_especialidad", v)}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>{SECTORES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="destructive" onClick={() => deleteTeamMember(member.id)}><Trash2 size={14} /></Button>
                      <Button size="sm" onClick={() => saveTeamMember(member)}><Save size={14} className="mr-1" />Guardar</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle className="flex items-center gap-2"><Truck size={18} /> Equipamiento e Infraestructura</CardTitle><CardDescription>Maquinaria, vehículos y recursos materiales</CardDescription></div>
                <Button size="sm" onClick={addEquipment}><Plus size={14} className="mr-1" />Añadir</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {equipment.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">Sin equipamiento registrado. Añade maquinaria, vehículos u otros recursos.</p>}
                {equipment.map(eq => (
                  <div key={eq.id} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div><Label>Nombre</Label><Input value={eq.nombre} onChange={e => updateEquipment(eq.id, "nombre", e.target.value)} /></div>
                      <div>
                        <Label>Tipo</Label>
                        <Select value={eq.tipo || "maquinaria"} onValueChange={v => updateEquipment(eq.id, "tipo", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{EQUIPMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div><Label>Cantidad</Label><Input type="number" min={1} value={eq.cantidad || 1} onChange={e => updateEquipment(eq.id, "cantidad", e.target.value)} /></div>
                      <div>
                        <Label>Estado</Label>
                        <Select value={eq.estado || "operativo"} onValueChange={v => updateEquipment(eq.id, "estado", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="operativo">Operativo</SelectItem>
                            <SelectItem value="mantenimiento">En mantenimiento</SelectItem>
                            <SelectItem value="fuera_servicio">Fuera de servicio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div><Label>Descripción</Label><Textarea value={eq.descripcion || ""} onChange={e => updateEquipment(eq.id, "descripcion", e.target.value)} placeholder="Modelo, características, capacidad..." /></div>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="destructive" onClick={() => deleteEquipment(eq.id)}><Trash2 size={14} /></Button>
                      <Button size="sm" onClick={() => saveEquipment(eq)}><Save size={14} className="mr-1" />Guardar</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CompanyProfile;
