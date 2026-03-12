/**
 * Converts structured analysis report data to formatted HTML for PDF/Word export.
 */
export function reportDataToHtml(data: any, tenderTitle: string): string {
  if (!data) return "";

  const sections: string[] = [];

  // Title
  sections.push(`<h1>Informe de Análisis — ${escHtml(tenderTitle)}</h1>`);

  // Scoring
  const scoring = data.scoring || {};
  if (scoring.iat !== undefined) {
    sections.push(`<h2>Motor de Scoring PLIEGO SMART</h2>`);
    sections.push(`<table style="width:100%;border-collapse:collapse;margin-bottom:12pt;">
      <tr><th style="text-align:left;padding:6pt;border-bottom:1px solid #ccc;">Indicador</th><th style="text-align:center;padding:6pt;border-bottom:1px solid #ccc;">Puntuación</th><th style="text-align:left;padding:6pt;border-bottom:1px solid #ccc;">Detalle</th></tr>
      <tr><td style="padding:6pt;">IAT – Adecuación Técnica</td><td style="text-align:center;padding:6pt;font-weight:bold;">${scoring.iat}/100</td><td style="padding:6pt;">${escHtml(scoring.iat_detalle || "")}</td></tr>
      <tr><td style="padding:6pt;">IRE – Riesgo de Exclusión</td><td style="text-align:center;padding:6pt;font-weight:bold;">${scoring.ire}/100</td><td style="padding:6pt;">${escHtml(scoring.ire_detalle || "")}</td></tr>
      <tr><td style="padding:6pt;">PEA – Prob. Adjudicación</td><td style="text-align:center;padding:6pt;font-weight:bold;">${scoring.pea}/100</td><td style="padding:6pt;">${escHtml(scoring.pea_detalle || "")}</td></tr>
    </table>`);
    if (scoring.recomendacion_presentarse) {
      const labels: Record<string, string> = {
        alta: "✅ Alta probabilidad – Presentarse",
        media: "⚠️ Probabilidad media – Evaluar",
        baja: "⚠️ Probabilidad baja – Riesgo elevado",
        no_recomendable: "❌ No recomendable presentarse",
      };
      sections.push(`<p style="text-align:center;font-weight:bold;font-size:13pt;margin:12pt 0;padding:10pt;border:1px solid #ccc;border-radius:6pt;">Recomendación: ${labels[scoring.recomendacion_presentarse] || scoring.recomendacion_presentarse}</p>`);
    }
  }

  // Sector
  if (data.sector_detectado) {
    sections.push(`<p><strong>Sector detectado:</strong> ${escHtml(data.sector_detectado)}</p>`);
  }

  // Resumen Ejecutivo
  if (data.resumen_ejecutivo) {
    sections.push(`<h2>Resumen Ejecutivo Estratégico</h2><p>${escHtml(data.resumen_ejecutivo)}</p>`);
  }

  // Datos Contractuales
  if (data.datos_contractuales) {
    sections.push(`<h2>Datos Contractuales Críticos</h2>`);
    sections.push(`<table style="width:100%;border-collapse:collapse;">`);
    for (const [key, val] of Object.entries(data.datos_contractuales)) {
      sections.push(`<tr><td style="padding:4pt 8pt;font-weight:bold;border-bottom:1px solid #eee;">${escHtml(key.replace(/_/g, " "))}</td><td style="padding:4pt 8pt;border-bottom:1px solid #eee;">${escHtml(String(val || "No especificado"))}</td></tr>`);
    }
    sections.push(`</table>`);
  }

  // Requisitos Administrativos
  if (data.requisitos_administrativos?.length) {
    sections.push(`<h2>Requisitos Administrativos</h2><ul>`);
    for (const r of data.requisitos_administrativos) {
      let line = escHtml(r.descripcion);
      if (r.normativa) line += ` <em>(Normativa: ${escHtml(r.normativa)})</em>`;
      if (r.riesgo_exclusion) line += ` — Riesgo: <strong>${escHtml(r.riesgo_exclusion)}</strong>`;
      sections.push(`<li>${line}</li>`);
    }
    sections.push(`</ul>`);
  }

  // Requisitos Técnicos
  if (data.requisitos_tecnicos?.length) {
    sections.push(`<h2>Requisitos Técnicos</h2><ul>`);
    for (const r of data.requisitos_tecnicos) {
      let line = escHtml(r.descripcion);
      const extras = [];
      if (r.experiencia_minima) extras.push(`Exp. mínima: ${escHtml(r.experiencia_minima)}`);
      if (r.equipo_minimo) extras.push(`Equipo: ${escHtml(r.equipo_minimo)}`);
      if (r.medios_minimos) extras.push(`Medios: ${escHtml(r.medios_minimos)}`);
      if (extras.length) line += ` <em>(${extras.join(" | ")})</em>`;
      sections.push(`<li>${line}</li>`);
    }
    sections.push(`</ul>`);
  }

  // Solvencia
  if (data.solvencia) {
    sections.push(`<h2>Solvencia Técnica y Económica</h2>`);
    for (const [tipo, items] of Object.entries(data.solvencia)) {
      sections.push(`<h3>${escHtml(tipo)}</h3><ul>`);
      const list = Array.isArray(items) ? items : [items];
      for (const item of list) sections.push(`<li>${escHtml(String(item))}</li>`);
      sections.push(`</ul>`);
    }
  }

  // Criterios de Adjudicación
  if (data.criterios_adjudicacion?.length) {
    sections.push(`<h2>Criterios de Adjudicación</h2>`);
    sections.push(`<table style="width:100%;border-collapse:collapse;"><tr><th style="text-align:left;padding:6pt;border-bottom:1px solid #ccc;">Criterio</th><th style="text-align:center;padding:6pt;border-bottom:1px solid #ccc;">Tipo</th><th style="text-align:center;padding:6pt;border-bottom:1px solid #ccc;">Ponderación</th></tr>`);
    for (const c of data.criterios_adjudicacion) {
      sections.push(`<tr><td style="padding:6pt;">${escHtml(c.criterio)}${c.formula ? ` <em>(${escHtml(c.formula)})</em>` : ""}</td><td style="text-align:center;padding:6pt;">${escHtml(c.tipo)}</td><td style="text-align:center;padding:6pt;font-weight:bold;">${c.ponderacion}%</td></tr>`);
    }
    sections.push(`</table>`);
  }

  // Análisis Sectorial
  if (data.analisis_sectorial) {
    sections.push(`<h2>Análisis Sectorial: ${escHtml(data.sector_detectado || "")}</h2><p>${escHtml(data.analisis_sectorial)}</p>`);
  }

  // Comparativa Empresa
  if (data.comparativa_empresa) {
    const c = data.comparativa_empresa;
    sections.push(`<h2>Comparativa Empresa vs Pliego</h2>`);
    sections.push(`<p><strong>Cumplimiento:</strong> ${escHtml(c.cumplimiento || "")}</p>`);
    if (c.fortalezas?.length) {
      sections.push(`<h3>✅ Fortalezas</h3><ul>${c.fortalezas.map((f: string) => `<li>${escHtml(f)}</li>`).join("")}</ul>`);
    }
    if (c.brechas?.length) {
      sections.push(`<h3>⚠️ Brechas</h3><ul>${c.brechas.map((b: string) => `<li>${escHtml(b)}</li>`).join("")}</ul>`);
    }
    if (c.acciones_recomendadas) {
      sections.push(`<p><strong>Acciones Recomendadas:</strong> ${escHtml(c.acciones_recomendadas)}</p>`);
    }
  }

  // Riesgos
  if (data.riesgos?.length) {
    sections.push(`<h2>Riesgos Jurídicos y Técnicos</h2><ul>`);
    for (const r of data.riesgos) {
      let line = `<strong>[${escHtml(r.nivel)}]</strong> (${escHtml(r.tipo)}) ${escHtml(r.descripcion)}`;
      if (r.mitigacion) line += ` — 💡 ${escHtml(r.mitigacion)}`;
      sections.push(`<li>${line}</li>`);
    }
    sections.push(`</ul>`);
  }

  // Estrategia
  if (data.estrategia) {
    sections.push(`<h2>Estrategia Recomendada</h2>`);
    if (data.estrategia.economica) sections.push(`<h3>💰 Estrategia Económica</h3><p>${escHtml(data.estrategia.economica)}</p>`);
    if (data.estrategia.tecnica) sections.push(`<h3>🔧 Estrategia Técnica</h3><p>${escHtml(data.estrategia.tecnica)}</p>`);
    if (data.estrategia.mejoras_propuestas) sections.push(`<h3>⭐ Mejoras Propuestas</h3><p>${escHtml(data.estrategia.mejoras_propuestas)}</p>`);
    if (data.estrategia.narrativa_recomendada) sections.push(`<h3>📝 Narrativa Recomendada</h3><p>${escHtml(data.estrategia.narrativa_recomendada)}</p>`);
  }

  // Checklist Documental
  if (data.checklist_documental?.length) {
    sections.push(`<h2>Checklist Documental</h2><ul>${data.checklist_documental.map((item: string) => `<li>☐ ${escHtml(item)}</li>`).join("")}</ul>`);
  }

  // Recomendaciones
  if (data.recomendaciones_presentacion?.length) {
    sections.push(`<h2>Recomendaciones para Presentación</h2><ol>${data.recomendaciones_presentacion.map((r: string) => `<li>${escHtml(r)}</li>`).join("")}</ol>`);
  }

  return sections.join("\n");
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const baseStyles = `body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.6;margin:2cm;color:#222;}
h1{font-size:18pt;color:#1a365d;border-bottom:2px solid #1a365d;padding-bottom:6pt;}
h2{font-size:14pt;color:#2d4a7a;margin-top:18pt;}
h3{font-size:12pt;color:#3d5a8a;}
table{margin:8pt 0;}
p{margin:6pt 0;}
ul,ol{margin:6pt 0 6pt 20pt;}`;

export function exportReportAsWord(data: any, tenderTitle: string) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Informe - ${tenderTitle}</title><style>${baseStyles}</style></head><body>${reportDataToHtml(data, tenderTitle)}</body></html>`;
  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `informe-${tenderTitle.slice(0, 30)}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportReportAsPdf(data: any, tenderTitle: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;
  printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Informe - ${tenderTitle}</title><style>${baseStyles} @media print{body{margin:0;}}</style></head><body>${reportDataToHtml(data, tenderTitle)}</body></html>`);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 500);
  return true;
}
