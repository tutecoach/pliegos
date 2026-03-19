import { z } from "zod";

/**
 * Schema Zod para el formulario de datos generales de empresa.
 * Valida antes de llamar a Supabase — eliminar confianza ciega en inputs del usuario.
 */
export const companySchema = z.object({
  name: z.string().min(2, "La razón social debe tener al menos 2 caracteres"),
  cif: z.string().optional(),
  address: z.string().optional(),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || /^[+\d\s\-()]{6,20}$/.test(v), {
      message: "Formato de teléfono inválido",
    }),
  website: z
    .string()
    .optional()
    .refine((v) => !v || v.startsWith("http") || v.startsWith("www") || !v.includes(" "), {
      message: "Ingresá una URL válida (ej: https://miempresa.com)",
    }),
  facturacion_anual: z.string().optional(),
  patrimonio_neto: z.string().optional(),
  clasificacion_empresarial: z.string().optional(),
  capacidad_tecnica: z.string().optional(),
  capacidad_economica: z.string().optional(),
  // sectores_actividad se maneja fuera del form (badges toggle)
});

export type CompanyFormData = z.infer<typeof companySchema>;
