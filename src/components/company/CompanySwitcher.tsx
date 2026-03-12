import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Building2, Plus, ArrowRightLeft } from "lucide-react";

interface CompanySwitcherProps {
  userId: string;
  currentCompanyId: string | null;
  onSwitch: (companyId: string) => void;
}

const CompanySwitcher = ({ userId, currentCompanyId, onSwitch }: CompanySwitcherProps) => {
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, [userId]);

  const loadCompanies = async () => {
    // Get companies from user_companies junction + the profile's current company
    const [ucRes, profileRes] = await Promise.all([
      supabase.from("user_companies").select("company_id").eq("user_id", userId),
      supabase.from("profiles").select("company_id").eq("user_id", userId).single(),
    ]);

    const companyIds = new Set<string>();
    if (profileRes.data?.company_id) companyIds.add(profileRes.data.company_id);
    (ucRes.data || []).forEach((uc: any) => companyIds.add(uc.company_id));

    if (companyIds.size === 0) return;

    const { data: companiesData } = await supabase
      .from("companies")
      .select("id, name")
      .in("id", Array.from(companyIds));

    setCompanies(companiesData || []);
  };

  const createCompany = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const newId = crypto.randomUUID();
      const { error: compError } = await supabase.from("companies").insert({ id: newId, name: newName.trim() });
      if (compError) throw compError;

      const { error: ucError } = await supabase.from("user_companies").insert({
        user_id: userId, company_id: newId, role: "owner", is_active: false,
      });
      if (ucError) throw ucError;

      // Create a default project for the new company
      await supabase.from("projects").insert({
        company_id: newId, name: "Proyecto General", status: "active",
      });

      toast({ title: "Empresa creada", description: `"${newName.trim()}" fue creada exitosamente.` });
      setNewName("");
      setShowCreate(false);
      await loadCompanies();
      onSwitch(newId);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  if (companies.length <= 1 && !showCreate) {
    return (
      <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
        <Plus size={14} className="mr-1" /> Añadir Empresa
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {companies.length > 1 && (
        <Select value={currentCompanyId || ""} onValueChange={onSwitch}>
          <SelectTrigger className="w-[220px]">
            <div className="flex items-center gap-2">
              <ArrowRightLeft size={14} />
              <SelectValue placeholder="Seleccionar empresa" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {companies.map(c => (
              <SelectItem key={c.id} value={c.id}>
                <div className="flex items-center gap-2">
                  <Building2 size={14} /> {c.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
        <Plus size={14} className="mr-1" /> Nueva
      </Button>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Empresa</DialogTitle>
            <DialogDescription>Agrega otra empresa para gestionar perfiles independientes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Razón Social</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre de la empresa" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={createCompany} disabled={creating || !newName.trim()}>
              {creating ? "Creando..." : "Crear Empresa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanySwitcher;
