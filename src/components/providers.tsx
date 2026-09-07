"use client";

import { createContext, useContext } from "react";
import { SessionProvider } from "next-auth/react";

interface AppSettings {
  currency: string;
  dateFormat: string;
  expenseCategories: string[];
}

const defaultSettings: AppSettings = {
  currency: "NGN",
  dateFormat: "MMM D, YYYY",
  expenseCategories: ["REPAIRS", "SERVICE_CHARGE", "UTILITIES", "INSURANCE", "MANAGEMENT_FEE", "OTHER"],
};

const SettingsContext = createContext<AppSettings>(defaultSettings);

export const useCurrency = () => useContext(SettingsContext).currency;
export const useDateFormat = () => useContext(SettingsContext).dateFormat;
export const useExpenseCategories = () => useContext(SettingsContext).expenseCategories;
export const useSettings = () => useContext(SettingsContext);

// Keep CurrencyContext export for backward compat
export const CurrencyContext = SettingsContext;

export function Providers({
  children,
  currency = "NGN",
  dateFormat = "MMM D, YYYY",
  expenseCategories = defaultSettings.expenseCategories,
}: Readonly<{ children: React.ReactNode; currency?: string; dateFormat?: string; expenseCategories?: string[] }>) {
  return (
    <SessionProvider>
      <SettingsContext.Provider value={{ currency, dateFormat, expenseCategories }}>
        {children}
      </SettingsContext.Provider>
    </SessionProvider>
  );
}
