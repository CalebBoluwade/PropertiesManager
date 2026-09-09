"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { setDataMode, setCurrency, setDateFormat, setExpenseCategories, type DataMode } from "@/lib/data-mode";
import { resetLiveData } from "@/app/dashboard/actions";
import { CURRENCIES, DATE_FORMATS, getCurrencySymbol } from "@/lib/fx";
import { useSettings } from "@/components/providers";

const ALL_CATEGORIES = [
  { value: "REPAIRS",        label: "Repairs & maintenance" },
  { value: "SERVICE_CHARGE", label: "Service charge" },
  { value: "UTILITIES",      label: "Utilities" },
  { value: "INSURANCE",      label: "Insurance" },
  { value: "MANAGEMENT_FEE", label: "Property management" },
  { value: "LEGAL",          label: "Legal & professional" },
  { value: "LANDSCAPING",    label: "Landscaping" },
  { value: "SECURITY",       label: "Security" },
  { value: "CLEANING",       label: "Cleaning" },
  { value: "OTHER",          label: "Other" },
];

interface Props {
  dataMode: DataMode;
}

export function SettingsClient({ dataMode }: Props) {
  const { currency, dateFormat, expenseCategories } = useSettings();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<DataMode>(dataMode);

  // local mirrors so UI updates instantly
  const [localCurrency, setLocalCurrency] = useState(currency);
  const [localDateFormat, setLocalDateFormat] = useState(dateFormat);
  const [localCategories, setLocalCategories] = useState<string[]>(expenseCategories);
  const [newCategory, setNewCategory] = useState("");

  function handleMode(m: DataMode) {
    setMode(m);
    startTransition(() => setDataMode(m));
  }

  function handleCurrency(code: string) {
    setLocalCurrency(code);
    startTransition(() => setCurrency(code));
  }

  function handleDateFormat(fmt: string) {
    setLocalDateFormat(fmt);
    startTransition(() => setDateFormat(fmt));
  }

  function toggleCategory(value: string) {
    const next = localCategories.includes(value)
      ? localCategories.filter((c) => c !== value)
      : [...localCategories, value];
    setLocalCategories(next);
    startTransition(() => setExpenseCategories(next));
  }

  function addCustomCategory() {
    const val = newCategory.trim().toUpperCase().replace(/\s+/g, "_");
    if (!val || localCategories.includes(val)) return;
    const next = [...localCategories, val];
    setLocalCategories(next);
    setNewCategory("");
    startTransition(() => setExpenseCategories(next));
  }

  function removeCategory(value: string) {
    const next = localCategories.filter((c) => c !== value);
    setLocalCategories(next);
    startTransition(() => setExpenseCategories(next));
  }

  const [confirmReset, setConfirmReset] = useState(false);

  async function handleReset() {
    if (!confirmReset) { setConfirmReset(true); return; }
    startTransition(async () => {
      await resetLiveData();
      setConfirmReset(false);
    });
  }

  const isDemo = mode === "demo";
  const customCategories = localCategories.filter(
    (c) => !ALL_CATEGORIES.some((a) => a.value === c)
  );

  return (
    <div className="min-h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your app preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-start">
        {/* Left — controls */}
        <div className="lg:col-span-2 space-y-6">

          {/* Data mode */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700">Data mode</h2>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Demo mode uses sample data so you can explore without affecting real records.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(["live", "demo"] as const).map((m) => {
                const active = mode === m;
                return (
                  <button
                    key={m}
                    onClick={() => handleMode(m)}
                    disabled={pending}
                    className={`flex flex-col items-start gap-1.5 rounded-xl border px-4 py-4 text-left transition-colors ${
                      active
                        ? m === "demo" ? "border-amber-400 bg-amber-50" : "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${active ? m === "demo" ? "bg-amber-400" : "bg-emerald-500" : "bg-slate-300"}`} />
                      <span className={`text-sm font-semibold capitalize ${active ? m === "demo" ? "text-amber-700" : "text-emerald-700" : "text-slate-500"}`}>
                        {m}
                      </span>
                    </span>
                    <span className="text-xs text-slate-400 leading-snug">
                      {m === "demo" ? "Sample data, no real records affected" : "Your real properties and tenants"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Currency */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700">Currency</h2>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              All monetary values across the app will display in this currency.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CURRENCIES.map((c) => {
                const active = localCurrency === c.code;
                return (
                  <button
                    key={c.code}
                    onClick={() => handleCurrency(c.code)}
                    disabled={pending}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3.5 text-sm transition-colors text-left ${
                      active
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{c.label}</span>
                    <span className="text-base font-semibold ml-2 shrink-0">{getCurrencySymbol(c.code)}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Date format */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700">Date format</h2>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              How dates are displayed throughout the app.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DATE_FORMATS.map((f) => {
                const active = localDateFormat === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => handleDateFormat(f.value)}
                    disabled={pending}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3.5 text-sm transition-colors text-left ${
                      active
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-mono text-xs">{f.value}</span>
                    <span className="text-xs text-slate-500 ml-2 shrink-0">{f.example}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Expense categories */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700">Expense categories</h2>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Choose which categories appear when logging expenses.
            </p>

            {/* Preset categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {ALL_CATEGORIES.map((cat) => {
                const active = localCategories.includes(cat.value);
                return (
                  <button
                    key={cat.value}
                    onClick={() => toggleCategory(cat.value)}
                    disabled={pending}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors text-left ${
                      active
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium"
                        : "border-slate-200 text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      active ? "bg-indigo-500 border-indigo-500" : "border-slate-300"
                    }`}>
                      {active && <span className="text-white text-[10px] leading-none">✓</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom categories */}
            {customCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {customCategories.map((c) => (
                  <span key={c} className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                    {c.replace(/_/g, " ")}
                    <button onClick={() => removeCategory(c)} className="text-slate-400 hover:text-slate-700">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add custom */}
            <div className="flex gap-2">
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomCategory())}
                placeholder="Add custom category…"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
              <button
                onClick={addCustomCategory}
                disabled={!newCategory.trim() || pending}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40 transition-colors"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </section>
          {/* Reset live data */}
          {!isDemo && (
            <section className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-red-700">Reset live data</h2>
              <p className="text-xs text-slate-400 mt-1 mb-5">
                Permanently deletes all properties, tenants, payments, and expenses. This cannot be undone.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  disabled={pending}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 ${
                    confirmReset
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "border border-red-300 text-red-600 hover:bg-red-50"
                  }`}
                >
                  {confirmReset ? "Yes, delete everything" : "Clear all data"}
                </button>
                {confirmReset && (
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="text-sm text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right — summary */}
        <div>
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Active configuration</h2>
            <div className="space-y-0 divide-y divide-slate-50">
              <div className="flex items-center justify-between py-3">
                <span className="text-xs text-slate-500">Data mode</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isDemo ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {isDemo ? "Demo" : "Live"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-xs text-slate-500">Currency</span>
                <span className="text-xs font-semibold text-slate-800">{getCurrencySymbol(localCurrency)} {localCurrency}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-xs text-slate-500">Date format</span>
                <span className="text-xs font-mono font-semibold text-slate-800">{localDateFormat}</span>
              </div>
              <div className="flex items-start justify-between py-3 gap-3">
                <span className="text-xs text-slate-500 shrink-0">Categories</span>
                <span className="text-xs font-semibold text-slate-800 text-right">{localCategories.length} active</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
