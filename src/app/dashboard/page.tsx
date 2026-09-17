"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileDown, RefreshCw, ChevronRight } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatCurrencyCompact, getCurrencySymbol } from "@/lib/fx";
import { useCurrency } from "@/components/providers";

interface UpcomingDue {
  tenantName: string;
  propertyName: string;
  amountDue: number;
  dueDate: string;
  status: string;
}

interface ExpiringLease {
  tenantName: string;
  propertyName: string;
  endDate: string;
  daysLeft: number;
}

interface HistoryPoint {
  month: string;
  rent: number;
  expenses: number;
}

interface DashboardData {
  monthlyRentExpected: number;
  occupancyRate: number;
  occupiedUnits: number;
  totalUnits: number;
  outstandingRent: number;
  monthlyExpenses: number;
  totalProperties: number;
  rentExpenseHistory: HistoryPoint[];
  upcomingDues: UpcomingDue[];
  expiringLeases: ExpiringLease[];
  lastUpdated: string;
}

const RANGES = ["3M", "6M", "12M"] as const;
type Range = typeof RANGES[number];

async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch("/api/dashboard");
  if (!response.ok) throw new Error("Failed to fetch dashboard data");
  return response.json();
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function statusClass(status: string) {
  if (status === "OVERDUE") return "bg-red-50 text-red-700";
  if (status === "PENDING") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState<Range>("6M");
  const dashboardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const currencyCode = useCurrency();
  const sym = getCurrencySymbol(currencyCode);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      setData(await fetchDashboardData());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const downloadPDF = () => {
    if (!data || !dashboardRef.current) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Dashboard Report</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:sans-serif;padding:32px}</style></head><body>${dashboardRef.current.innerHTML}</body></html>`;
    const windowRef = window.open(URL.createObjectURL(new Blob([html], { type: "text/html" })), "_blank");
    if (windowRef) windowRef.addEventListener("load", () => windowRef.print());
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center text-sm text-slate-500">Loading dashboard...</div>;
  if (!data) return <div className="flex h-[60vh] items-center justify-center text-sm text-red-600">Failed to load dashboard data</div>;

  let rangeLength = 12;
  if (range === "3M") rangeLength = 3;
  if (range === "6M") rangeLength = 6;
  const history = data.rentExpenseHistory.slice(-rangeLength);
  const metrics = [
    { label: "Expected rent", value: formatCurrencyCompact(data.monthlyRentExpected, sym), detail: `Across ${data.totalProperties} properties`, href: "/dashboard/payments", formula: "Σ tenant.monthlyRent" },
    { label: "Outstanding rent", value: formatCurrencyCompact(data.outstandingRent, sym), detail: data.outstandingRent > 0 ? "Needs collection" : "Nothing outstanding", href: "/dashboard/payments", alert: data.outstandingRent > 0, formula: "Σ max(0, amountDue − amountPaid) for DUE/PENDING/OVERDUE obligations" },
    { label: "Occupancy", value: `${data.occupancyRate.toFixed(0)}%`, detail: `${data.occupiedUnits} of ${data.totalUnits} units occupied`, href: "/dashboard/properties", formula: "occupiedUnits ÷ totalUnits × 100" },
    { label: "Expenses this month", value: formatCurrencyCompact(data.monthlyExpenses, sym), detail: "Recorded expenses", href: "/dashboard/expenses", formula: "Σ expense.amount for current month" },
  ];

  return (
    <div ref={dashboardRef} className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Overview</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Good morning</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data.lastUpdated ? `Updated ${timeAgo(data.lastUpdated)}` : "Your portfolio at a glance"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(true)} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50" aria-label="Refresh dashboard">
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button onClick={downloadPDF} className="flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800">
            <FileDown size={15} />
            Export
          </button>
        </div>
      </header>

      <section aria-label="Portfolio summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <button key={metric.label} onClick={() => router.push(metric.href)} className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">{metric.label}</p>
              {metric.alert && <span className="h-2 w-2 rounded-full bg-amber-500" aria-label="Needs attention" />}
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{metric.value}</p>
            <p className="mt-1 text-xs text-slate-500">{metric.detail}</p>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
              Formula: <span className="normal-case tracking-normal text-slate-500">{metric.formula}</span>
            </p>
          </button>
        ))}
      </section>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">Rent collected and expenses</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Monthly totals from recorded transactions</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1 text-xs">
            {RANGES.map((item) => <button key={item} onClick={() => setRange(item)} className={`rounded-md px-2.5 py-1 font-medium ${range === item ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-50"}`}>{item}</button>)}
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-4 pt-2 sm:px-4">
          <div className="mb-2 flex flex-wrap gap-4 px-2 text-xs text-slate-500">
            <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-slate-900" />Rent collected</span>
            <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-amber-500" />Expenses</span>
          </div>
          <p className="mb-3 px-2 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
            Formula: rent = Σ paid obligations in period; expenses = Σ expense entries in period
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={history} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="rentFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0f172a" stopOpacity={0.14} /><stop offset="95%" stopColor="#0f172a" stopOpacity={0} /></linearGradient>
                <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.14} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(value) => `${sym}${(value / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(15,23,42,0.08)", fontSize: 12 }} formatter={(value) => formatCurrency(Number(value), sym)} />
              <Area type="monotone" dataKey="rent" name="Rent collected" stroke="#0f172a" strokeWidth={2} fill="url(#rentFill)" dot={false} />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f59e0b" strokeWidth={2} fill="url(#expenseFill)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-label="Items needing attention">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div><CardTitle className="text-base font-semibold text-slate-900">Rent to follow up</CardTitle><p className="mt-1 text-sm text-slate-500">Due or outstanding in the next 7 days</p></div>
            <button onClick={() => router.push("/dashboard/payments")} className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-950">View all <ChevronRight size={15} /></button>
          </CardHeader>
          <CardContent>
            {data.upcomingDues.length === 0 ? <p className="py-5 text-sm text-slate-500">Nothing to follow up on.</p> : <div className="divide-y divide-slate-100">{data.upcomingDues.slice(0, 4).map((due, index) => <div key={`${due.tenantName}-${index}`} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{due.tenantName}</p><p className="truncate text-xs text-slate-500">{due.propertyName} · {new Date(due.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p></div><div className="flex shrink-0 items-center gap-2"><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(due.status)}`}>{due.status}</span><span className="text-sm font-semibold text-slate-800">{formatCurrency(due.amountDue, sym)}</span></div></div>)}</div>}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div><CardTitle className="text-base font-semibold text-slate-900">Leases to review</CardTitle><p className="mt-1 text-sm text-slate-500">Expiring in the next 60 days</p></div>
            <button onClick={() => router.push("/dashboard/tenants")} className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-950">View all <ChevronRight size={15} /></button>
          </CardHeader>
          <CardContent>
            {data.expiringLeases.length === 0 ? <p className="py-5 text-sm text-slate-500">No leases need review.</p> : <div className="divide-y divide-slate-100">{data.expiringLeases.slice(0, 4).map((lease, index) => <div key={`${lease.tenantName}-${index}`} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{lease.tenantName}</p><p className="truncate text-xs text-slate-500">{lease.propertyName} · expires {new Date(lease.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${lease.daysLeft <= 14 ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>{lease.daysLeft}d left</span></div>)}</div>}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
