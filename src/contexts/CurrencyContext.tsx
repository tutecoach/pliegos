import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CurrencyCode = "USD" | "EUR" | "ARS" | "MXN" | "COP" | "CLP" | "PEN" | "UYU" | "BRL";

export interface CurrencyOption {
  code: CurrencyCode;
  label: string;
  symbol: string;
  locale: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "USD", label: "Dólar estadounidense", symbol: "$", locale: "en-US" },
  { code: "EUR", label: "Euro", symbol: "€", locale: "es-ES" },
  { code: "ARS", label: "Peso argentino", symbol: "$", locale: "es-AR" },
  { code: "MXN", label: "Peso mexicano", symbol: "$", locale: "es-MX" },
  { code: "COP", label: "Peso colombiano", symbol: "$", locale: "es-CO" },
  { code: "CLP", label: "Peso chileno", symbol: "$", locale: "es-CL" },
  { code: "PEN", label: "Sol peruano", symbol: "S/", locale: "es-PE" },
  { code: "UYU", label: "Peso uruguayo", symbol: "$", locale: "es-UY" },
  { code: "BRL", label: "Real brasileño", symbol: "R$", locale: "pt-BR" },
];

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  formatCurrency: (amount: number) => string;
  currencyOption: CurrencyOption;
}

const STORAGE_KEY = "pliego-smart-currency";

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "USD",
  setCurrency: () => undefined,
  formatCurrency: (n) => `$${n}`,
  currencyOption: CURRENCY_OPTIONS[0],
});

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
    if (saved && CURRENCY_OPTIONS.some(o => o.code === saved)) {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
  };

  const currencyOption = CURRENCY_OPTIONS.find(o => o.code === currency) || CURRENCY_OPTIONS[0];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(currencyOption.locale, {
      style: "currency",
      currency: currencyOption.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const value = useMemo(() => ({ currency, setCurrency, formatCurrency, currencyOption }), [currency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => useContext(CurrencyContext);
