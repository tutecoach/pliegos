import { describe, it, expect, vi, beforeEach } from "vitest";
import { reportDataToHtml, exportReportAsWord, exportReportAsPdf } from "@/lib/report-export";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MINIMAL_REPORT = {
  scoring: { iat: 72, ire: 85, pea: 68, recomendacion_presentarse: "alta" },
  sector_detectado: "Construcción",
  resumen_ejecutivo: "Pliego de construcción de bajo riesgo.",
};

const FULL_REPORT = {
  ...MINIMAL_REPORT,
  datos_contractuales: { presupuesto: "500.000€", duracion: "24 meses" },
  requisitos_administrativos: [
    { descripcion: "Estar al corriente de impuestos", normativa: "RD 1098/2001", riesgo_exclusion: "alto" },
  ],
  requisitos_tecnicos: [
    { descripcion: "Experiencia en obras similares", experiencia_minima: "3 años", equipo_minimo: "Retroexcavadora" },
  ],
  criterios_adjudicacion: [
    { criterio: "Oferta económica", tipo: "automatico", ponderacion: 60, formula: "P = (Po/Pm) x 60" },
  ],
  comparativa_empresa: {
    cumplimiento: "alto",
    fortalezas: ["Certificación ISO 9001", "Más de 5 años en el sector"],
    brechas: ["Falta seguro de responsabilidad civil adicional"],
    acciones_recomendadas: "Contratar póliza RC antes de la presentación",
  },
  riesgos: [
    { nivel: "alto", tipo: "legal", descripcion: "Posible subcontratación no declarada", mitigacion: "Declarar subcontratistas" },
  ],
  estrategia: {
    economica: "Baja ajustada al 5% del presupuesto base.",
    tecnica: "Destacar certificaciones ISO y experiencia previa.",
  },
  checklist_documental: ["Declaración responsable", "Solvencia económica"],
  recomendaciones_presentacion: ["Revisar plazo de garantía", "Incluir plan de gestión de residuos"],
  solvencia: {
    "Técnica": ["3 contratos similares en los últimos 5 años"],
    "Económica": ["Volumen anual ≥ 500.000€"],
  },
};

// ─── Tests: reportDataToHtml ──────────────────────────────────────────────────

describe("reportDataToHtml", () => {
  it("retorna string vacío si data es null/undefined", () => {
    expect(reportDataToHtml(null, "Test")).toBe("");
    expect(reportDataToHtml(undefined, "Test")).toBe("");
  });

  it("incluye el título en un h1", () => {
    const html = reportDataToHtml(MINIMAL_REPORT, "Limpieza Municipal");
    expect(html).toContain("<h1>");
    expect(html).toContain("Limpieza Municipal");
  });

  it("escapa HTML en el título (XSS prevention)", () => {
    const html = reportDataToHtml(MINIMAL_REPORT, "<script>alert(1)</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("incluye los scores IAT, IRE, PEA cuando existen", () => {
    const html = reportDataToHtml(MINIMAL_REPORT, "Test");
    expect(html).toContain("72/100");
    expect(html).toContain("85/100");
    expect(html).toContain("68/100");
  });

  it("muestra la recomendación de presentarse", () => {
    const html = reportDataToHtml(MINIMAL_REPORT, "Test");
    expect(html).toContain("Alta probabilidad");
  });

  it("muestra 'no_recomendable' correctamente", () => {
    const data = { ...MINIMAL_REPORT, scoring: { ...MINIMAL_REPORT.scoring, recomendacion_presentarse: "no_recomendable" } };
    const html = reportDataToHtml(data, "Test");
    expect(html).toContain("No recomendable presentarse");
  });

  it("incluye el sector detectado", () => {
    const html = reportDataToHtml(FULL_REPORT, "Test");
    expect(html).toContain("Construcción");
  });

  it("incluye los datos contractuales como tabla", () => {
    const html = reportDataToHtml(FULL_REPORT, "Test");
    expect(html).toContain("Datos Contractuales Críticos");
    expect(html).toContain("500.000€");
    expect(html).toContain("24 meses");
  });

  it("incluye requisitos administrativos con riesgo de exclusión", () => {
    const html = reportDataToHtml(FULL_REPORT, "Test");
    expect(html).toContain("Estar al corriente de impuestos");
    expect(html).toContain("RD 1098/2001");
    expect(html).toContain("alto");
  });

  it("incluye requisitos técnicos con experiencia y equipo", () => {
    const html = reportDataToHtml(FULL_REPORT, "Test");
    expect(html).toContain("Experiencia en obras similares");
    expect(html).toContain("3 años");
    expect(html).toContain("Retroexcavadora");
  });

  it("incluye criterios de adjudicación con ponderación", () => {
    const html = reportDataToHtml(FULL_REPORT, "Test");
    expect(html).toContain("Criterios de Adjudicación");
    expect(html).toContain("60%");
    expect(html).toContain("P = (Po/Pm) x 60");
  });

  it("incluye fortalezas y brechas de empresa", () => {
    const html = reportDataToHtml(FULL_REPORT, "Test");
    expect(html).toContain("Certificación ISO 9001");
    expect(html).toContain("Falta seguro de responsabilidad civil adicional");
  });

  it("incluye los riesgos con nivel y mitigación", () => {
    const html = reportDataToHtml(FULL_REPORT, "Test");
    expect(html).toContain("[alto]");
    expect(html).toContain("Declarar subcontratistas");
  });

  it("incluye la estrategia económica y técnica", () => {
    const html = reportDataToHtml(FULL_REPORT, "Test");
    expect(html).toContain("Estrategia Económica");
    expect(html).toContain("Baja ajustada al 5%");
  });

  it("incluye el checklist documental con checkboxes", () => {
    const html = reportDataToHtml(FULL_REPORT, "Test");
    expect(html).toContain("☐ Declaración responsable");
    expect(html).toContain("☐ Solvencia económica");
  });

  it("incluye las recomendaciones de presentación numeradas", () => {
    const html = reportDataToHtml(FULL_REPORT, "Test");
    expect(html).toContain("<ol>");
    expect(html).toContain("Revisar plazo de garantía");
  });

  it("incluye la solvencia por tipo", () => {
    const html = reportDataToHtml(FULL_REPORT, "Test");
    expect(html).toContain("Técnica");
    expect(html).toContain("3 contratos similares");
  });

  it("escapa HTML en contenido de datos (XSS prevention)", () => {
    const malicious = {
      ...MINIMAL_REPORT,
      resumen_ejecutivo: '<img src=x onerror="alert(1)">',
    };
    const html = reportDataToHtml(malicious, "Test");
    expect(html).not.toContain('<img src=x');
    expect(html).toContain("&lt;img");
  });

  it("no incluye secciones vacías si no hay datos", () => {
    const html = reportDataToHtml({ scoring: {} }, "Sin datos");
    expect(html).not.toContain("Criterios de Adjudicación");
    expect(html).not.toContain("Checklist Documental");
  });
});

// ─── Tests: exportReportAsWord ────────────────────────────────────────────────

describe("exportReportAsWord", () => {
  it("crea un enlace de descarga con extensión .doc", () => {
    // Arrange: mock completo del anchor antes de llamar a exportReportAsWord
    const mockAnchor = { href: "", download: "", click: vi.fn() };
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") return mockAnchor as unknown as HTMLElement;
      return document.createElement(tag);
    });
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:mock-url"),
      revokeObjectURL: vi.fn(),
    });

    exportReportAsWord(MINIMAL_REPORT, "Mi Licitación");

    // El anchor debe haberse clickeado
    expect(mockAnchor.click).toHaveBeenCalledOnce();
    // El download debe empezar con 'informe-'
    expect(mockAnchor.download).toMatch(/^informe-/);
  });

  it("el nombre de descarga está basado en el título", () => {
    const mockAnchor = { href: "", download: "", click: vi.fn() };
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") return mockAnchor as unknown as HTMLElement;
      return document.createElement(tag);
    });
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:mock-url"),
      revokeObjectURL: vi.fn(),
    });

    exportReportAsWord(MINIMAL_REPORT, "Licitacion de Limpieza Municipal 2024");
    expect(mockAnchor.download).toContain("informe-");
    expect(mockAnchor.download).toMatch(/\.doc$/);
  });
});

// ─── Tests: exportReportAsPdf ─────────────────────────────────────────────────

describe("exportReportAsPdf", () => {
  it("retorna false si window.open devuelve null", () => {
    vi.stubGlobal("window", { ...window, open: vi.fn(() => null) });
    const result = exportReportAsPdf(MINIMAL_REPORT, "Test");
    expect(result).toBe(false);
  });

  it("retorna true cuando abre una ventana de impresión", () => {
    const mockPrintWindow = {
      document: { write: vi.fn(), close: vi.fn() },
      print: vi.fn(),
    };
    vi.stubGlobal("window", { ...window, open: vi.fn(() => mockPrintWindow) });
    const result = exportReportAsPdf(MINIMAL_REPORT, "Test");
    expect(result).toBe(true);
    expect(mockPrintWindow.document.write).toHaveBeenCalledOnce();
    expect(mockPrintWindow.document.close).toHaveBeenCalledOnce();
  });
});
