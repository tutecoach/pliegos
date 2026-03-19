import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Hook genérico para CRUD sobre tablas de Supabase con estado local.
 * Elimina el código duplicado de add/update/save/delete repetido en CompanyProfile.
 *
 * @param table   Nombre de la tabla en Supabase
 * @param companyId  ID de la empresa actual (para asociar nuevos registros)
 */
export function useEntityCrud<T extends Record<string, unknown> & { id: string }>(
  table: string,
  companyId: string | null
) {
  const [items, setItems] = useState<T[]>([]);

  /** Reemplaza el estado local completo (usado al cargar datos iniciales) */
  const setAll = (data: T[]) => setItems(data);

  /** Crea un nuevo registro en Supabase y lo agrega al estado local */
  const add = async (defaultData: Partial<Omit<T, "id">>, prepend = false) => {
    if (!companyId) return;
    const { data, error } = await supabase
      .from(table)
      .insert({ company_id: companyId, ...defaultData })
      .select()
      .single();
    if (error) {
      toast({ title: "Error al añadir", description: error.message, variant: "destructive" });
      return;
    }
    if (data) {
      setItems((prev) => prepend ? [data as T, ...prev] : [...prev, data as T]);
    }
  };

  /** Actualiza un campo específico de un item en el estado local (sin guardar aún en DB) */
  const updateField = (id: string, field: keyof T, value: unknown) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  /** Persiste un item (o campos específicos de él) en Supabase */
  const save = async (id: string, fields: Partial<T>, successMsg = "Guardado correctamente") => {
    const { error } = await supabase.from(table).update(fields).eq("id", id);
    if (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: successMsg });
    return true;
  };

  /** Elimina un registro de Supabase y lo quita del estado local */
  const remove = async (id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return { items, setAll, add, updateField, save, remove };
}
