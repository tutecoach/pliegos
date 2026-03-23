import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type PublicTables = Database["public"]["Tables"];

/**
 * Hook genérico para CRUD sobre tablas de Supabase con tipado estricto.
 *
 * @param table      Nombre de la tabla en Supabase
 * @param companyId  ID de la empresa actual (para asociar nuevos registros)
 */
export function useEntityCrud<TName extends keyof PublicTables>(
  table: TName,
  companyId: string | null
) {
  type Row = PublicTables[TName]["Row"];
  type Insert = PublicTables[TName]["Insert"];
  type Update = PublicTables[TName]["Update"];

  const [items, setItems] = useState<Row[]>([]);

  /** Reemplaza el estado local completo */
  const setAll = (data: Row[]) => setItems(data);

  /** Crea un nuevo registro en Supabase y lo agrega al estado local */
  const add = async (
    defaultData: Omit<Insert, "company_id" | "id">,
    prepend = false
  ) => {
    if (!companyId) return;

    // Forzamos el tipado del insert para que acepte company_id
    const payload = { 
      company_id: companyId, 
      ...defaultData 
    } as unknown as Insert;

    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select()
      .single();

    if (error) {
      toast({ 
        title: "Error al añadir", 
        description: error.message, 
        variant: "destructive" 
      });
      return;
    }

    if (data) {
      setItems((prev) => (prepend ? [data, ...prev] : [...prev, data]));
    }
  };

  /** Actualiza un campo específico de un item en el estado local (optimistic update) */
  const updateField = <K extends keyof Row>(id: string, field: K, value: Row[K]) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  /** Persiste un item en Supabase */
  const save = async (
    id: string, 
    fields: Update, 
    successMsg = "Guardado correctamente"
  ) => {
    const { error } = await supabase
      .from(table)
      .update(fields)
      .eq("id" as any, id);

    if (error) {
      toast({ 
        title: "Error al guardar", 
        description: error.message, 
        variant: "destructive" 
      });
      return false;
    }

    toast({ title: successMsg });
    return true;
  };

  /** Elimina un registro de Supabase y lo quita del estado local */
  const remove = async (id: string) => {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id" as any, id);

    if (error) {
      toast({ 
        title: "Error al eliminar", 
        description: error.message, 
        variant: "destructive" 
      });
      return;
    }
    setItems((prev) => prev.filter((item: any) => item.id !== id));
  };

  return { items, setAll, add, updateField, save, remove };
}
