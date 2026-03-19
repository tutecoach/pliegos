import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText, AlertTriangle, CheckCircle, Target, Shield, ListChecks,
  Lightbulb, BarChart3, Building2, Compass, ClipboardList, Zap, BookMarked,
} from "lucide-react";

interface AnalysisReportProps {
  data: any;
}

const SourceTag = ({ fuente }: { fuente?: string }) => {
  if (!fuente) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-primary/70 bg-primary/5 border border-primary/10 rounded px-1.5 py-0.5 mt-1">
      <BookMarked size={10} className="shrink-0" />
      <span className="truncate max-w-[300px]">{fuente}</span>
    </span>
  );
};

const ScoreGauge = ({ label, value, detail, icon: Icon }: { label: string; value: number; detail?: string; icon: any }) => {
  const color = value >= 70 ? "text-green-600" : value >= 40 ? "text-yellow-600" : "text-destructive";
  const bgColor = value >= 70 ? "bg-green-500" : value >= 40 ? "bg-yellow-500" : "bg-destructive";
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} className="text-primary" />
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-end gap-2 mb-2">
        <span className={`text-3xl font-bold ${color}`}>{value}</span>
        <span className="text-muted-foreground text-sm mb-1">/100</span>
      </div>
      <Progress value={value} className={`h-2 [&>div]:${bgColor}`} />
      {detail && <p className="text-xs text-muted-foreground mt-2">{detail}</p>}
    </div>
  );
};

// Helper to normalize solvencia items (supports both old string[] and new {texto, fuente}[] formats)
const normalizeSolvenciaItems = (items: any): { texto: string; fuente?: string }[] => {
  if (!items) return [];
  if (!Array.isArray(items)) return [{ texto: String(items) }];
  return items.map((item: any) => {
    if (typeof item === "string") return { texto: item };
    if (item?.texto) return item;
    return { texto: String(item) };
  });
};

const AnalysisReport = ({ data }: AnalysisReportProps) => {
  if (!data) return null;

  if (data.parse_error) {
    return (
      <Card><CardHeader><CardTitle>Análisis (formato libre)</CardTitle></CardHeader>
        <CardContent><pre className="whitespace-pre-wrap text-sm text-muted-foreground">{data.raw_analysis}</pre></CardContent>
      </Card>
    );
  }

  const scoring = data.scoring || {};
  const recomendacionColor: Record<string, string> = {
    alta: "bg-green-100 text-green-800 border-green-300",
    media: "bg-yellow-100 text-yellow-800 border-yellow-300",
    baja: "bg-orange-100 text-orange-800 border-orange-300",
    no_recomendable: "bg-red-100 text-red-800 border-red-300",
  };

  const riskColor = (nivel: string) => {
    switch (nivel?.toLowerCase()) {
      case "alto": return "destructive";
      case "medio": return "secondary";
      case "bajo": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Contingency mode warning */}
      {data.modo_contingencia && (
        <div className="rounded-xl border-2 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/30 p-5 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-yellow-600 shrink-0" />
            <h3 className="font-bold text-yellow-800 dark:text-yellow-400">Informe Preliminar — Modo Contingencia</h3>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Este análisis se generó <strong>sin el motor IA completo</strong> debido a créditos insuficientes. 
            Los scores IAT/IRE/PEA son estimaciones conservadoras y los datos contractuales provienen solo de metadatos, no del análisis profundo de documentos.
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
            📌 Recomendación: Recargá créditos de IA y usá el botón "Re-analizar" para obtener el informe estratégico completo.
          </p>
        </div>
      )}

      {/* Scoring Dashboard */}
      {scoring.iat !== undefined && (
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2"><Target size={20} className="text-primary" />Motor de Scoring PLIEGO SMART</h3>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <ScoreGauge label="IAT – Adecuación Técnica" value={scoring.iat} detail={scoring.iat_detalle} icon={Shield} />
            <ScoreGauge label="IRE – Riesgo de Exclusión" value={scoring.ire} detail={scoring.ire_detalle} icon={AlertTriangle} />
            <ScoreGauge label="PEA – Prob. Adjudicación" value={scoring.pea} detail={scoring.pea_detalle} icon={Zap} />
          </div>
          {scoring.recomendacion_presentarse && (
            <div className={`rounded-xl border p-4 text-center font-semibold ${recomendacionColor[scoring.recomendacion_presentarse] || ""}`}>
              Recomendación: {scoring.recomendacion_presentarse === "alta" ? "✅ Alta probabilidad – Presentarse" :
                scoring.recomendacion_presentarse === "media" ? "⚠️ Probabilidad media – Evaluar" :
                scoring.recomendacion_presentarse === "baja" ? "⚠️ Probabilidad baja – Riesgo elevado" :
                "❌ No recomendable presentarse"}
            </div>
          )}
        </div>
      )}

      {/* Sector */}
      {data.sector_detectado && (
        <Badge variant="secondary" className="text-sm px-3 py-1">
          <Compass size={14} className="mr-1" /> Sector: {data.sector_detectado}
        </Badge>
      )}

      {/* Resumen Ejecutivo */}
      {data.resumen_ejecutivo && (
        <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><FileText size={18} className="text-primary" />Resumen Ejecutivo Estratégico</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{data.resumen_ejecutivo}</p></CardContent>
        </Card>
      )}

      {/* Datos Contractuales */}
      {data.datos_contractuales && (
        <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BarChart3 size={18} className="text-primary" />Datos Contractuales Críticos</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.entries(data.datos_contractuales)
                .filter(([key]) => key !== "fuentes")
                .map(([key, val]) => (
                  <div key={key} className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</p>
                    <p className="text-sm font-medium mt-0.5">{String(val) || "No especificado"}</p>
                  </div>
                ))}
            </div>
            {data.datos_contractuales.fuentes && (
              <div className="mt-3">
                <SourceTag fuente={data.datos_contractuales.fuentes} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Requisitos Administrativos */}
      {data.requisitos_administrativos?.length > 0 && (
        <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ClipboardList size={18} className="text-primary" />Requisitos Administrativos</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.requisitos_administrativos.map((r: any, i: number) => (
              <div key={i} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                <CheckCircle size={14} className={`shrink-0 mt-0.5 ${r.obligatorio !== false ? "text-destructive" : "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.descripcion}</p>
                  {r.normativa && <p className="text-xs text-muted-foreground">Normativa: {r.normativa}</p>}
                  <SourceTag fuente={r.fuente} />
                </div>
                {r.riesgo_exclusion && <Badge variant={riskColor(r.riesgo_exclusion) as any} className="shrink-0">{r.riesgo_exclusion}</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Requisitos Técnicos */}
      {data.requisitos_tecnicos?.length > 0 && (
        <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ListChecks size={18} className="text-primary" />Requisitos Técnicos</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.requisitos_tecnicos.map((r: any, i: number) => (
              <div key={i} className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium">{r.descripcion}</p>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                  {r.experiencia_minima && <span>📋 Exp. mínima: {r.experiencia_minima}</span>}
                  {r.equipo_minimo && <span>👥 Equipo: {r.equipo_minimo}</span>}
                  {r.medios_minimos && <span>🔧 Medios: {r.medios_minimos}</span>}
                </div>
                <SourceTag fuente={r.fuente} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Solvencia */}
      {data.solvencia && (
        <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Shield size={18} className="text-primary" />Solvencia Técnica y Económica</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.solvencia).map(([tipo, items]: [string, any]) => {
              const normalized = normalizeSolvenciaItems(items);
              if (normalized.length === 0) return null;
              return (
                <div key={tipo}>
                  <p className="text-sm font-medium capitalize mb-1">{tipo}</p>
                  <ul className="space-y-1">
                    {normalized.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        <div className="flex items-start gap-2">
                          <CheckCircle size={14} className="text-primary shrink-0 mt-0.5" />
                          <div>
                            <span>{item.texto}</span>
                            <SourceTag fuente={item.fuente} />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Criterios */}
      {data.criterios_adjudicacion?.length > 0 && (
        <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ListChecks size={18} className="text-primary" />Criterios de Adjudicación</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.criterios_adjudicacion.map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{c.criterio}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={c.tipo === "automatico" ? "outline" : "secondary"} className="text-xs">{c.tipo}</Badge>
                    {c.formula && <span className="text-xs text-muted-foreground">Fórmula: {c.formula}</span>}
                  </div>
                  {c.subapartados && <p className="text-xs text-muted-foreground mt-1">{c.subapartados}</p>}
                  <SourceTag fuente={c.fuente} />
                </div>
                <span className="text-lg font-bold text-primary shrink-0 ml-3">{c.ponderacion}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Análisis Sectorial */}
      {data.analisis_sectorial && (
        <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Compass size={18} className="text-primary" />Análisis Sectorial: {data.sector_detectado}</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{data.analisis_sectorial}</p></CardContent>
        </Card>
      )}

      {/* Comparativa Empresa */}
      {data.comparativa_empresa && (
        <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Building2 size={18} className="text-primary" />Comparativa Empresa vs Pliego</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Badge variant={data.comparativa_empresa.cumplimiento === "total" ? "default" : data.comparativa_empresa.cumplimiento === "parcial" ? "secondary" : "destructive"}>
              Cumplimiento: {data.comparativa_empresa.cumplimiento}
            </Badge>
            {data.comparativa_empresa.fortalezas?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">✅ Fortalezas</p>
                <ul className="space-y-1">{data.comparativa_empresa.fortalezas.map((f: string, i: number) => <li key={i} className="text-sm text-muted-foreground">• {f}</li>)}</ul>
              </div>
            )}
            {data.comparativa_empresa.brechas?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-destructive mb-1">⚠️ Brechas</p>
                <ul className="space-y-1">{data.comparativa_empresa.brechas.map((b: string, i: number) => <li key={i} className="text-sm text-muted-foreground">• {b}</li>)}</ul>
              </div>
            )}
            {data.comparativa_empresa.acciones_recomendadas && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium mb-1">Acciones Recomendadas</p>
                <p className="text-sm text-muted-foreground">{data.comparativa_empresa.acciones_recomendadas}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Riesgos */}
      {data.riesgos?.length > 0 && (
        <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle size={18} className="text-yellow-600" />Riesgos Jurídicos y Técnicos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.riesgos.map((r: any, i: number) => (
              <div key={i} className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant={riskColor(r.nivel) as any}>{r.nivel}</Badge>
                  <Badge variant="outline" className="text-xs">{r.tipo}</Badge>
                  <p className="text-sm font-medium">{r.descripcion}</p>
                </div>
                {r.mitigacion && <p className="text-xs text-muted-foreground ml-1">💡 {r.mitigacion}</p>}
                <SourceTag fuente={r.fuente} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Estrategia */}
      {data.estrategia && (
        <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Lightbulb size={18} className="text-yellow-500" />Estrategia Recomendada</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.estrategia.economica && <div className="bg-muted/50 rounded-lg p-3"><p className="text-xs font-medium text-muted-foreground mb-1">💰 Estrategia Económica</p><p className="text-sm">{data.estrategia.economica}</p></div>}
            {data.estrategia.tecnica && <div className="bg-muted/50 rounded-lg p-3"><p className="text-xs font-medium text-muted-foreground mb-1">🔧 Estrategia Técnica</p><p className="text-sm">{data.estrategia.tecnica}</p></div>}
            {data.estrategia.mejoras_propuestas && <div className="bg-muted/50 rounded-lg p-3"><p className="text-xs font-medium text-muted-foreground mb-1">⭐ Mejoras Propuestas</p><p className="text-sm">{data.estrategia.mejoras_propuestas}</p></div>}
            {data.estrategia.narrativa_recomendada && <div className="bg-muted/50 rounded-lg p-3"><p className="text-xs font-medium text-muted-foreground mb-1">📝 Narrativa Recomendada</p><p className="text-sm">{data.estrategia.narrativa_recomendada}</p></div>}
          </CardContent>
        </Card>
      )}

      {/* Checklist Documental */}
      {data.checklist_documental?.length > 0 && (
        <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ClipboardList size={18} className="text-primary" />Checklist Documental</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {data.checklist_documental.map((item: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">☐</span>{item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recomendaciones Presentación */}
      {data.recomendaciones_presentacion?.length > 0 && (
        <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Lightbulb size={18} className="text-primary" />Recomendaciones para Presentación</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.recomendaciones_presentacion.map((r: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary font-bold shrink-0">{i + 1}.</span>{r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalysisReport;
