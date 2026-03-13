import { useState, useMemo, useRef, useEffect } from "react";
import { CLAE_CODES, CLAE_SECTIONS, type ClaeCode } from "@/data/clae-codes";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClaeSelectorProps {
  /** JSON array string like '["011111 - Cultivo de arroz","410011 - Construcción..."]' or legacy single value */
  value: string;
  onChange: (value: string) => void;
}

function parseValues(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Legacy single value
  }
  return raw ? [raw] : [];
}

function findCode(entry: string): ClaeCode | null {
  const match = entry.match(/^(\d{6})/);
  return match ? CLAE_CODES.find(c => c.code === match[1]) || null : null;
}

const ClaeSelector = ({ value, onChange }: ClaeSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedValues = useMemo(() => parseValues(value), [value]);
  const selectedCodes = useMemo(
    () => selectedValues.map(v => ({ raw: v, code: findCode(v) })).filter(x => x.code),
    [selectedValues]
  );

  const selectedCodeSet = useMemo(
    () => new Set(selectedCodes.map(x => x.code!.code)),
    [selectedCodes]
  );

  const filteredCodes = useMemo(() => {
    let codes = CLAE_CODES;
    if (selectedSection) codes = codes.filter(c => c.section === selectedSection);
    if (search.trim()) {
      const terms = search.toLowerCase().split(/\s+/);
      codes = codes.filter(c => {
        const text = `${c.code} ${c.description}`.toLowerCase();
        return terms.every(t => text.includes(t));
      });
    }
    return codes.slice(0, 50);
  }, [search, selectedSection]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleCode = (code: ClaeCode) => {
    const entry = `${code.code} - ${code.description}`;
    let next: string[];
    if (selectedCodeSet.has(code.code)) {
      next = selectedValues.filter(v => !v.startsWith(code.code));
    } else {
      next = [...selectedValues, entry];
    }
    onChange(next.length ? JSON.stringify(next) : "");
  };

  const removeCode = (codeStr: string) => {
    const next = selectedValues.filter(v => !v.startsWith(codeStr));
    onChange(next.length ? JSON.stringify(next) : "");
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const sectionName = (letter: string) =>
    CLAE_SECTIONS.find(s => s.letter === letter)?.name || letter;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <div
        className={cn(
          "flex items-start gap-2 min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer ring-offset-background",
          "hover:border-primary/50 transition-colors",
          open && "ring-2 ring-ring ring-offset-2"
        )}
        onClick={() => {
          setOpen(!open);
          if (!open) setTimeout(() => inputRef.current?.focus(), 100);
        }}
      >
        <div className="flex-1 min-w-0">
          {selectedCodes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedCodes.map(({ code }) => (
                <Badge
                  key={code!.code}
                  variant="secondary"
                  className="gap-1 text-xs font-normal pr-1"
                >
                  <span className="font-mono">{code!.code}</span>
                  <span className="max-w-[180px] truncate">{code!.description}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeCode(code!.code); }}
                    className="ml-0.5 p-0.5 rounded hover:bg-muted-foreground/20 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">
              Buscar actividades CLAE (ARCA)...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          {selectedCodes.length > 0 && (
            <button
              onClick={clearAll}
              className="p-0.5 rounded hover:bg-muted transition-colors"
              title="Limpiar todas"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center border-b px-3 py-2 gap-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por código o descripción..."
              className="border-0 p-0 h-auto text-sm focus-visible:ring-0 shadow-none"
            />
          </div>

          <div className="border-b px-2 py-2">
            <div className="flex gap-1 flex-wrap">
              <Badge
                variant={selectedSection === null ? "default" : "outline"}
                className="cursor-pointer text-xs shrink-0"
                onClick={() => setSelectedSection(null)}
              >
                Todas
              </Badge>
              {CLAE_SECTIONS.map(s => (
                <Badge
                  key={s.letter}
                  variant={selectedSection === s.letter ? "default" : "outline"}
                  className="cursor-pointer text-xs shrink-0"
                  onClick={() => setSelectedSection(selectedSection === s.letter ? null : s.letter)}
                  title={s.name}
                >
                  {s.letter}
                </Badge>
              ))}
            </div>
            {selectedSection && (
              <p className="text-xs text-muted-foreground mt-1 px-1">
                {sectionName(selectedSection)}
              </p>
            )}
          </div>

          <ScrollArea className="max-h-[280px]">
            <div className="p-1">
              {filteredCodes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No se encontraron actividades
                </p>
              ) : (
                filteredCodes.map(code => {
                  const isSelected = selectedCodeSet.has(code.code);
                  return (
                    <div
                      key={code.code}
                      className={cn(
                        "flex items-center gap-2 px-2 py-2 rounded-sm cursor-pointer text-sm",
                        "hover:bg-accent hover:text-accent-foreground transition-colors",
                        isSelected && "bg-accent/60"
                      )}
                      onClick={() => toggleCode(code)}
                    >
                      <div className={cn(
                        "h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors",
                        isSelected ? "bg-primary border-primary text-primary-foreground" : "border-input"
                      )}>
                        {isSelected && <span className="text-[10px]">✓</span>}
                      </div>
                      <Badge variant="outline" className="shrink-0 font-mono text-xs min-w-[60px] justify-center">
                        {code.code}
                      </Badge>
                      <span className="truncate">{code.description}</span>
                      <Badge variant="secondary" className="shrink-0 text-[10px] ml-auto">
                        {code.section}
                      </Badge>
                    </div>
                  );
                })
              )}
              {filteredCodes.length >= 50 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Mostrando primeros 50 resultados. Refiná tu búsqueda.
                </p>
              )}
            </div>
          </ScrollArea>

          {selectedCodes.length > 0 && (
            <div className="border-t px-3 py-2 text-xs text-muted-foreground">
              {selectedCodes.length} actividad{selectedCodes.length > 1 ? "es" : ""} seleccionada{selectedCodes.length > 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClaeSelector;
