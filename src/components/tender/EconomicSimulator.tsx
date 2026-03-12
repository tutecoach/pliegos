import { useState, useMemo } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Calculator, AlertTriangle, CheckCircle } from "lucide-react";

interface EconomicSimulatorProps {
  presupuestoBase?: number;
  criteriosEconomicos?: any[];
}

const EconomicSimulator = ({ presupuestoBase = 100000, criteriosEconomicos = [] }: EconomicSimulatorProps) => {
  const { formatCurrency } = useCurrency();
  const [bajaPercent, setBajaPercent] = useState(10);
  const [presupuesto, setPresupuesto] = useState(presupuestoBase);

  const simulation = useMemo(() => {
    const oferta = presupuesto * (1 - bajaPercent / 100);
    const umbralTemeraria = presupuesto * 0.75;
    const esTemeraria = oferta < umbralTemeraria;
    const maxEconPoints = criteriosEconomicos.reduce((acc: number, c: any) => acc + (c.ponderacion || 0), 0) || 50;
    const puntuacionEcon = Math.max(0, (bajaPercent / 30) * maxEconPoints);
    const puntuacionFinal = Math.min(puntuacionEcon, maxEconPoints);
    const rentabilidad = ((presupuesto - oferta) / presupuesto) * 100;
    let riesgo: "bajo" | "medio" | "alto" | "critico";
    if (bajaPercent < 8) riesgo = "bajo";
    else if (bajaPercent < 15) riesgo = "medio";
    else if (bajaPercent < 25) riesgo = "alto";
    else riesgo = "critico";
    return { oferta, esTemeraria, puntuacionFinal, maxEconPoints, rentabilidad, riesgo, umbralTemeraria };
  }, [bajaPercent, presupuesto, criteriosEconomicos]);

  const riesgoColors: Record<string, string> = {
    bajo: "bg-green-100 text-green-800",
    medio: "bg-yellow-100 text-yellow-800",
    alto: "bg-orange-100 text-orange-800",
    critico: "bg-red-100 text-red-800",
  };

  const scenarios = [
    { name: "Conservadora", baja: 5, desc: "Máximo margen, mínimo riesgo" },
    { name: "Moderada", baja: 12, desc: "Equilibrio puntuación/margen" },
    { name: "Agresiva", baja: 22, desc: "Máxima puntuación, margen bajo" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calculator size={20} className="text-primary" />Simulador Económico Interactivo</CardTitle>
        <CardDescription>Simula diferentes escenarios de baja para evaluar impacto en puntuación y riesgo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Presupuesto base de licitación</Label>
          <CurrencyInput value={presupuesto.toString()} onChange={v => setPresupuesto(parseFloat(v) || 0)} className="mt-1" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Porcentaje de baja: <span className="text-primary font-bold">{bajaPercent}%</span></Label>
            <span className="text-sm text-muted-foreground">Oferta: {formatCurrency(simulation.oferta)}</span>
          </div>
          <Slider value={[bajaPercent]} onValueChange={([v]) => setBajaPercent(v)} min={0} max={40} step={0.5} className="my-4" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0% (sin baja)</span>
            <span>40% (muy agresiva)</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Puntuación Económica</p>
            <p className="text-2xl font-bold text-primary">{simulation.puntuacionFinal.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">/ {simulation.maxEconPoints} pts</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Nivel de Riesgo</p>
            <Badge className={riesgoColors[simulation.riesgo]}>{simulation.riesgo.toUpperCase()}</Badge>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Margen Bruto</p>
            <p className="text-2xl font-bold">{(100 - bajaPercent).toFixed(1)}%</p>
          </div>
          <div className={`rounded-lg p-4 text-center ${simulation.esTemeraria ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
            <p className="text-xs text-muted-foreground mb-1">Baja Temeraria</p>
            {simulation.esTemeraria ? (
              <div className="flex items-center justify-center gap-1 text-red-700 font-bold"><AlertTriangle size={18} />SÍ</div>
            ) : (
              <div className="flex items-center justify-center gap-1 text-green-700 font-bold"><CheckCircle size={18} />NO</div>
            )}
          </div>
        </div>

        {simulation.esTemeraria && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
            <AlertTriangle size={16} className="inline mr-2" />
            <strong>¡Atención!</strong> La oferta está por debajo del umbral de baja temeraria ({formatCurrency(simulation.umbralTemeraria)}). 
            Podría ser rechazada o requerir justificación adicional.
          </div>
        )}

        <div>
          <p className="text-sm font-medium mb-3">Escenarios rápidos</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {scenarios.map(s => (
              <button
                key={s.name}
                onClick={() => setBajaPercent(s.baja)}
                className={`border rounded-lg p-3 text-left transition-colors hover:bg-muted/50 ${bajaPercent === s.baja ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
                <p className="text-sm font-bold text-primary mt-1">Baja {s.baja}%</p>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EconomicSimulator;
