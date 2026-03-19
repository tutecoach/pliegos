import { z } from "zod";

/**
 * Schema Zod para el formulario de nueva licitación (paso "info" de NewAnalysis).
 * Garantiza que los campos obligatorios estén presentes antes de crear el registro.
 */
export const tenderSchema = z.object({
  title: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(200, "El título es demasiado largo"),
  contractingEntity: z.string().optional(),
  contractAmount: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(parseFloat(v)), {
      message: "El presupuesto debe ser un número válido",
    }),
  valorEstimado: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(parseFloat(v)), {
      message: "El valor estimado debe ser un número válido",
    }),
  duration: z.string().optional(),
  deadline: z.string().optional(),
  garantiaProv: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(parseFloat(v)), {
      message: "La garantía debe ser un número válido",
    }),
  garantiaDef: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(parseFloat(v)), {
      message: "La garantía debe ser un número válido",
    }),
  clasificacionReq: z.string().optional(),
  sector: z.string().optional(),
  projectId: z.string().min(1, "Seleccioná un proyecto"),
});

export type TenderFormData = z.infer<typeof tenderSchema>;
