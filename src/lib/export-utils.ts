/**
 * Utilidades de exportación compartidas entre TechnicalMemory y report-export.
 */

/** Convierte markdown básico a HTML para exportación Word/PDF */
export function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/^- (.*$)/gim, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gims, "<ul>$1</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^(.+)$/gm, (match) => (match.startsWith("<") ? match : `<p>${match}</p>`));
}

const DOCUMENT_STYLES = `
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.6; margin: 2cm; color: #222; }
  h1 { font-size: 18pt; color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 6pt; }
  h2 { font-size: 14pt; color: #2d4a7a; margin-top: 18pt; }
  h3 { font-size: 12pt; color: #3d5a8a; }
  p { margin: 6pt 0; }
  ul { margin: 6pt 0 6pt 20pt; }
`;

/** Descarga contenido como archivo markdown (.md) */
export function downloadAsMarkdown(content: string, filePrefix: string): void {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filePrefix.slice(0, 30)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Descarga contenido como archivo Word (.doc) */
export function downloadAsWord(content: string, title: string, filePrefix: string): void {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>${DOCUMENT_STYLES}</style></head>
<body>${markdownToHtml(content)}</body></html>`;

  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filePrefix.slice(0, 30)}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Abre ventana de impresión del navegador para PDF */
export function printAsPdf(content: string, title: string): boolean {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;

  printWindow.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>${DOCUMENT_STYLES}
@media print { body { margin: 0; } }</style></head>
<body>${markdownToHtml(content)}</body></html>`);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 500);
  return true;
}
