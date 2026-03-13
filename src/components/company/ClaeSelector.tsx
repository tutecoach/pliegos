import { useState, useMemo, useRef, useEffect } from "react";
import { CLAE_CODES, CLAE_SECTIONS, type ClaeCode } from "@/data/clae-codes";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClaeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const ClaeSelector = ({ value, onChange }: ClaeSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find current selection
  const selectedCode = useMemo(() => {
    if (!value) return null;
    // Try matching by code first, then by full string "code - description"
    const codeMatch = value.match(/^(\d{6})/);
    const code = codeMatch ? codeMatch[1] : null;
    return code ? CLAE_CODES.find(c => c.code === code) : null;
  }, [value]);

  // Filter codes
  const filteredCodes = useMemo(() => {
    let codes = CLAE_CODES;
    if (selectedSection) {
      codes = codes.filter(c => c.section === selectedSection);
    }
    if (search.trim()) {
      const terms = search.toLowerCase().split(/\s+/);
      codes = codes.filter(c => {
        const text = `${c.code} ${c.description}`.toLowerCase();
        return terms.every(t => text.includes(t));
      });
    }
    return codes.slice(0, 50); // Limit for performance
  }, [search, selectedSection]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (code: ClaeCode) => {
    onChange(`${code.code} - ${code.description}`);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  const sectionName = (letter: string) =>
    CLAE_SECTIONS.find(s => s.letter === letter)?.name || letter;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <div
        className={cn(
          "flex items-center gap-2 min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer ring-offset-background",
          "hover:border-primary/50 transition-colors",
          open && "ring-2 ring-ring ring-offset-2"
        )}
        onClick={() => {
          setOpen(!open);
          if (!open) setTimeout(() => inputRef.current?.focus(), 100);
        }}
      >
        {selectedCode ? (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <Badge variant="secondary" className="shrink-0 font-mono text-xs">
              {selectedCode.code}
            </Badge>
            <span className="truncate text-sm">{selectedCode.description}</span>
          </div>
        ) : (
          <span className="flex-1 text-muted-foreground text-sm">
            Buscar actividad CLAE (ARCA)...
          </span>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {selectedCode && (
            <button
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-muted transition-colors"
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
          {/* Search */}
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

          {/* Section filters */}
          <div className="border-b px-2 py-2">
            <ScrollArea className="w-full" type="scroll">
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
            </ScrollArea>
            {selectedSection && (
              <p className="text-xs text-muted-foreground mt-1 px-1">
                {sectionName(selectedSection)}
              </p>
            )}
          </div>

          {/* Results */}
          <ScrollArea className="max-h-[280px]">
            <div className="p-1">
              {filteredCodes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No se encontraron actividades
                </p>
              ) : (
                filteredCodes.map(code => (
                  <div
                    key={code.code}
                    className={cn(
                      "flex items-center gap-2 px-2 py-2 rounded-sm cursor-pointer text-sm",
                      "hover:bg-accent hover:text-accent-foreground transition-colors",
                      selectedCode?.code === code.code && "bg-accent"
                    )}
                    onClick={() => handleSelect(code)}
                  >
                    <Badge variant="outline" className="shrink-0 font-mono text-xs min-w-[60px] justify-center">
                      {code.code}
                    </Badge>
                    <span className="truncate">{code.description}</span>
                    <Badge variant="secondary" className="shrink-0 text-[10px] ml-auto">
                      {code.section}
                    </Badge>
                  </div>
                ))
              )}
              {filteredCodes.length >= 50 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Mostrando primeros 50 resultados. Refiná tu búsqueda.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default ClaeSelector;
