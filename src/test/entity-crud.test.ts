import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock de Supabase — no llama a la red
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: "server-id-123" }, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

// Mock del toast
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

import { useEntityCrud } from "@/hooks/useEntityCrud";
import { SECTORES } from "@/data/sectores";

// TestEntity implementa la restricción Record<string, unknown> & { id: string }
interface TestEntity {
  id: string;
  company_id: string;
  name: string;
  value?: string;
  [key: string]: unknown;
}

const COMPANY_ID = "test-company-id";

afterEach(() => {
  vi.clearAllMocks();
});

// ─── SECTORES ─────────────────────────────────────────────────────────────────

describe("SECTORES", () => {
  it("es un array con al menos 5 sectores", () => {
    expect(Array.isArray(SECTORES)).toBe(true);
    expect(SECTORES.length).toBeGreaterThan(5);
  });

  it("no tiene sectores duplicados", () => {
    const unique = new Set(SECTORES);
    expect(unique.size).toBe(SECTORES.length);
  });

  it("todos los elementos son strings no vacíos", () => {
    for (const s of SECTORES) {
      expect(typeof s).toBe("string");
      expect(s.trim().length).toBeGreaterThan(0);
    }
  });

  it("incluye sectores clave del dominio de licitaciones", () => {
    // Verificamos que distintas categorías esperables existan en SECTORES
    const allLower = SECTORES.join(" ").toLowerCase();
    expect(allLower).toMatch(/obra/);         // Obras Civiles
    expect(allLower).toMatch(/tecnolog/);     // Tecnología
    expect(allLower).toMatch(/servicio/);     // Servicios Generales
  });
});

// ─── useEntityCrud ─────────────────────────────────────────────────────────────

describe("useEntityCrud — estado local", () => {
  it("inicializa con items vacío", () => {
    const { result } = renderHook(() =>
      useEntityCrud<TestEntity>("test_table", COMPANY_ID)
    );
    expect(result.current.items).toEqual([]);
  });

  it("setAll reemplaza todos los items", () => {
    const { result } = renderHook(() =>
      useEntityCrud<TestEntity>("test_table", COMPANY_ID)
    );
    const items: TestEntity[] = [
      { id: "1", company_id: COMPANY_ID, name: "A" },
      { id: "2", company_id: COMPANY_ID, name: "B" },
    ];
    act(() => { result.current.setAll(items); });
    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0].name).toBe("A");
    expect(result.current.items[1].name).toBe("B");
  });

  it("updateField actualiza el campo de un item específico", () => {
    const { result } = renderHook(() =>
      useEntityCrud<TestEntity>("test_table", COMPANY_ID)
    );
    act(() => {
      result.current.setAll([{ id: "1", company_id: COMPANY_ID, name: "Original" }]);
    });
    act(() => { result.current.updateField("1", "name", "Actualizado"); });
    expect(result.current.items[0].name).toBe("Actualizado");
  });

  it("updateField no toca otros items", () => {
    const { result } = renderHook(() =>
      useEntityCrud<TestEntity>("test_table", COMPANY_ID)
    );
    act(() => {
      result.current.setAll([
        { id: "1", company_id: COMPANY_ID, name: "Uno" },
        { id: "2", company_id: COMPANY_ID, name: "Dos" },
      ]);
    });
    act(() => { result.current.updateField("1", "name", "Uno Modificado"); });
    expect(result.current.items[1].name).toBe("Dos");
  });

  it("remove está disponible como función", () => {
    const { result } = renderHook(() =>
      useEntityCrud<TestEntity>("test_table", COMPANY_ID)
    );
    expect(typeof result.current.remove).toBe("function");
  });

  it("save está disponible como función", () => {
    const { result } = renderHook(() =>
      useEntityCrud<TestEntity>("test_table", COMPANY_ID)
    );
    expect(typeof result.current.save).toBe("function");
  });
});
