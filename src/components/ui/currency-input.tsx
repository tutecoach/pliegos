import * as React from "react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  showSymbol?: boolean;
}

/**
 * Input that formats numbers with locale-aware separators.
 * Stores raw numeric string, displays formatted.
 */
const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, showSymbol = true, ...props }, ref) => {
    const { currencyOption } = useCurrency();
    const [displayValue, setDisplayValue] = React.useState("");
    const [isFocused, setIsFocused] = React.useState(false);

    // Format number for display
    const formatDisplay = React.useCallback(
      (raw: string) => {
        if (!raw) return "";
        const num = parseFloat(raw);
        if (isNaN(num)) return raw;
        return new Intl.NumberFormat(currencyOption.locale, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(num);
      },
      [currencyOption.locale]
    );

    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatDisplay(value));
      }
    }, [value, isFocused, formatDisplay]);

    const handleFocus = () => {
      setIsFocused(true);
      setDisplayValue(value); // Show raw number when editing
    };

    const handleBlur = () => {
      setIsFocused(false);
      setDisplayValue(formatDisplay(value));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9.,\-]/g, "").replace(",", ".");
      onChange(raw);
    };

    return (
      <div className="relative">
        {showSymbol && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
            {currencyOption.symbol}
          </span>
        )}
        <input
          type="text"
          inputMode="decimal"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            showSymbol && "pl-8",
            className
          )}
          ref={ref}
          value={isFocused ? value : displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </div>
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
