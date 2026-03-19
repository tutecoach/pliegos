import { describe, it, expect } from "vitest";
import { companySchema } from "@/schemas/company.schema";
import { tenderSchema } from "@/schemas/tender.schema";

// ─── companySchema ────────────────────────────────────────────────────────────

describe("companySchema", () => {
  it("valida un objeto mínimo válido (solo name)", () => {
    const result = companySchema.safeParse({ name: "Mi Empresa SL" });
    expect(result.success).toBe(true);
  });

  it("falla si name tiene menos de 2 caracteres", () => {
    const result = companySchema.safeParse({ name: "A" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/2 caracteres/);
  });

  it("falla si name está vacío", () => {
    const result = companySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("acepta teléfono válido con +", () => {
    const result = companySchema.safeParse({ name: "Empresa", phone: "+34 600 123 456" });
    expect(result.success).toBe(true);
  });

  it("falla si teléfono tiene caracteres inválidos", () => {
    const result = companySchema.safeParse({ name: "Empresa", phone: "abc-def-ghi" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/teléfono/i);
  });

  it("acepta teléfono vacío (campo opcional)", () => {
    const result = companySchema.safeParse({ name: "Empresa", phone: "" });
    // phone vacío pasa porque regex no aplica a string vacío
    expect(result.success).toBe(true);
  });

  it("acepta website con https", () => {
    const result = companySchema.safeParse({ name: "Empresa", website: "https://miempresa.com" });
    expect(result.success).toBe(true);
  });

  it("acepta website vacío (opcional)", () => {
    const result = companySchema.safeParse({ name: "Empresa", website: "" });
    expect(result.success).toBe(true);
  });

  it("acepta todos los campos opcionales", () => {
    const result = companySchema.safeParse({
      name: "Constructora Pérez SL",
      cif: "B12345678",
      address: "Calle Mayor 1, Madrid",
      phone: "+34 91 000 00 00",
      website: "https://constructoraperez.es",
      facturacion_anual: "1500000",
      patrimonio_neto: "500000",
      clasificacion_empresarial: "C-6",
      capacidad_tecnica: "Equipos pesados y personal cualificado",
      capacidad_economica: "Ratio de solvencia 1.5",
    });
    expect(result.success).toBe(true);
  });
});

// ─── tenderSchema ─────────────────────────────────────────────────────────────

describe("tenderSchema", () => {
  const VALID_TENDER = {
    title: "Servicio de limpieza del Ayuntamiento",
    projectId: "550e8400-e29b-41d4-a716-446655440000",
  };

  it("valida un tender mínimo válido", () => {
    const result = tenderSchema.safeParse(VALID_TENDER);
    expect(result.success).toBe(true);
  });

  it("falla si title tiene menos de 3 caracteres", () => {
    const result = tenderSchema.safeParse({ ...VALID_TENDER, title: "AB" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/3 caracteres/);
  });

  it("falla si title tiene más de 200 caracteres", () => {
    const result = tenderSchema.safeParse({ ...VALID_TENDER, title: "A".repeat(201) });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/demasiado largo/);
  });

  it("falla si projectId está vacío", () => {
    const result = tenderSchema.safeParse({ title: "Licitación válida", projectId: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("projectId");
  });

  it("falla si contractAmount no es número", () => {
    const result = tenderSchema.safeParse({ ...VALID_TENDER, contractAmount: "no-es-numero" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/número válido/);
  });

  it("acepta contractAmount numérico como string", () => {
    const result = tenderSchema.safeParse({ ...VALID_TENDER, contractAmount: "250000.50" });
    expect(result.success).toBe(true);
  });

  it("acepta contractAmount vacío (opcional)", () => {
    const result = tenderSchema.safeParse({ ...VALID_TENDER, contractAmount: "" });
    expect(result.success).toBe(true);
  });

  it("falla si garantiaProv no es numérico", () => {
    const result = tenderSchema.safeParse({ ...VALID_TENDER, garantiaProv: "text" });
    expect(result.success).toBe(false);
  });

  it("acepta garantiaDef vacío (opcional)", () => {
    const result = tenderSchema.safeParse({ ...VALID_TENDER, garantiaDef: "" });
    expect(result.success).toBe(true);
  });

  it("acepta fecha deadline como string datetime-local", () => {
    const result = tenderSchema.safeParse({ ...VALID_TENDER, deadline: "2024-12-31T23:59" });
    expect(result.success).toBe(true);
  });

  it("valida un tender completamente lleno", () => {
    const result = tenderSchema.safeParse({
      title: "Obras de pavimentación del Polígono Industrial Norte",
      contractingEntity: "Ayuntamiento de Alcorcón",
      contractAmount: "1200000",
      valorEstimado: "1000000",
      duration: "18 meses",
      deadline: "2024-06-30T12:00",
      garantiaProv: "15000",
      garantiaDef: "60000",
      clasificacionReq: "Grupo C, Subgrupo 6, Categoría D",
      sector: "Construcción",
      projectId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });
});
