import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Target,
  Shield,
  ListChecks,
  Lightbulb,
  BarChart3,
} from "lucide-react";

interface AnalysisReportProps {
  data: any;
}

const AnalysisReport = ({ data }: AnalysisReportProps) => {
  if (!data) return null;

  if (data.parse_error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Análisis (formato libre)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{data.raw_analysis}</pre>
        </CardContent>
      </Card>
    );
  }

  const viabilidad = data.puntuacion_viabilidad || 0;
  const viabilidadColor =
    viabilidad >= 70 ? "text-green-600" : viabilidad >= 40 ? "text-yellow-600" : "text-destructive";

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
      {/* Viabilidad Score */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Target size={24} className="text-primary" />
              <div>
                <h3 className="font-semibold text-lg">Puntuación de Viabilidad</h3>
                <p className="text-sm text-muted-foreground">Estimación basada en el análisis del pliego</p>
              </div>
            </div>
            <span className={`text-4xl font-bold ${viabilidadColor}`}>{viabilidad}/100</span>
          </div>
          <Progress value={viabilidad} className="h-3" />
        </CardContent>
      </Card>

      {/* Resumen Ejecutivo */}
      {data.resumen_ejecutivo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              Resumen Ejecutivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.resumen_ejecutivo}</p>
          </CardContent>
        </Card>
      )}

      {/* Datos Generales */}
      {data.datos_generales && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" />
              Datos Generales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.entries(data.datos_generales).map(([key, val]) => (
                <div key={key} className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</p>
                  <p className="text-sm font-medium mt-0.5">{String(val) || "No especificado"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Criterios de Adjudicación */}
      {data.criterios_adjudicacion?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ListChecks size={18} className="text-primary" />
              Criterios de Adjudicación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.criterios_adjudicacion.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{c.criterio}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.tipo}</p>
                  </div>
                  <Badge variant="secondary" className="text-sm font-bold">{c.ponderacion}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requisitos de Solvencia */}
      {data.requisitos_solvencia && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield size={18} className="text-primary" />
              Requisitos de Solvencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.requisitos_solvencia).map(([tipo, items]: [string, any]) => (
              <div key={tipo}>
                <p className="text-sm font-medium capitalize mb-1">{tipo}</p>
                <ul className="space-y-1">
                  {(Array.isArray(items) ? items : [items]).map((item: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle size={14} className="text-primary shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Requisitos Técnicos */}
      {data.requisitos_tecnicos?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ListChecks size={18} className="text-primary" />
              Requisitos Técnicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {data.requisitos_tecnicos.map((r: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <CheckCircle size={14} className="text-primary shrink-0 mt-0.5" />
                  {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Riesgos */}
      {data.riesgos_identificados?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle size={18} className="text-yellow-600" />
              Riesgos Identificados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.riesgos_identificados.map((r: any, i: number) => (
              <div key={i} className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={riskColor(r.nivel) as any}>{r.nivel}</Badge>
                  <p className="text-sm font-medium">{r.riesgo}</p>
                </div>
                {r.mitigacion && (
                  <p className="text-xs text-muted-foreground ml-1">💡 {r.mitigacion}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recomendaciones */}
      {data.recomendaciones?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb size={18} className="text-yellow-500" />
              Recomendaciones Estratégicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.recomendaciones.map((r: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                  {r}
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
