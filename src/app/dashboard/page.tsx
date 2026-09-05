"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatCurrencyCompact } from "@/lib/fx";
import {
  FileDown, TrendingUp, TrendingDown, Building2, Users, Wallet,
  AlertCircle, Clock, CalendarX, RefreshCw, ChevronRight,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  RadialBarChart, RadialBar, BarChart, Bar,
} from "recharts";

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

interface PropertyBreakdown {
  name: string;
  rent: number;
  expenses: number;
  units: number;
  occupied: number;
}

interface HistoryPoint {
  month: string;
  rent: number;
  expenses: number;
  cashFlow: number;
}

interface DashboardData {
  portfolioValue: number;
  monthlyRentExpected: number;
  occupancyRate: number;
  occupiedUnits: number;
  totalUnits: number;
  outstandingRent: number;
  monthlyExpenses: number;
  netCashFlow: number;
  totalProperties: number;
  totalTenants: number;
  paidRent: number;
  pendingRent: number;
  overdueRent: number;
  totalExpensesAllTime: number;
  expensesByCategory: Record<string, number>;
  rentExpenseHistory: HistoryPoint[];
  propertyBreakdown: PropertyBreakdown[];
  upcomingDues: UpcomingDue[];
  expiringLeases: ExpiringLease[];
  lastUpdated: string;
}

const CAT_COLORS = ["#6366f1","#f59e0b","#ef4444","#10b981","#3b82f6","#ec4899","#8b5cf6","#14b8a6","#f97316","#06b6d4"];
const RANGES = ["3M","6M","12M"] as const;
type Range = typeof RANGES[number];

async function fetchDashboardData(): Promise<DashboardData> {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw new Error("Failed to fetch dashboard data");
  return res.json();
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    OVERDUE: "bg-red-100 text-red-700",
    PENDING: "bg-amber-100 text-amber-700",
    DUE: "bg-blue-100 text-blue-700",
  };
  return map[status] ?? "bg-slate-100 text-slate-600";
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visible, setVisible] = useState(false);
  const [range, setRange] = useState<Range>("6M");
  const dashboardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const d = await fetchDashboardData();
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (data) setTimeout(() => setVisible(true), 50);
  }, [data]);

  const downloadPDF = () => {
    if (!data || !dashboardRef.current) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Dashboard Report</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:sans-serif;padding:32px}</style></head><body>${dashboardRef.current.innerHTML}</body></html>`;
    const w = window.open(URL.createObjectURL(new Blob([html], { type: "text/html" })), "_blank");
    if (w) w.addEventListener("load", () => w.print());
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        <p className="text-slate-500 text-sm">Loading portfolio data…</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center h-[60vh] text-red-500">Failed to load dashboard data</div>
  );

  const sliceCount = range === "3M" ? 3 : range === "6M" ? 6 : 12;
  const waveData = data.rentExpenseHistory.slice(-sliceCount);

  const rentPie = [
    { name: "Paid", value: data.paidRent, color: "#10b981" },
    { name: "Pending", value: data.pendingRent, color: "#f59e0b" },
    { name: "Overdue", value: data.overdueRent, color: "#ef4444" },
  ].filter(d => d.value > 0);

  const occupancyPie = [
    { name: "Occupied", value: data.occupiedUnits, color: "#6366f1" },
    { name: "Vacant", value: data.totalUnits - data.occupiedUnits, color: "#e2e8f0" },
  ];

  const expensesBar = Object.entries(data.expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt], i) => ({ name: cat.replaceAll("_", " "), value: amt, color: CAT_COLORS[i % CAT_COLORS.length] }));

  const radialData = [{ name: "Occupancy", value: data.occupancyRate, fill: "#6366f1" }];

  const kpis = [
    { label: "Portfolio Value", value: formatCurrencyCompact(data.portfolioValue), icon: Building2, gradient: "from-indigo-500 to-violet-600", sub: `${data.totalProperties} properties`, href: "/dashboard/properties" },
    { label: "Monthly Rent", value: formatCurrencyCompact(data.monthlyRentExpected), icon: Wallet, gradient: "from-emerald-500 to-teal-600", sub: `${data.totalUnits} units`, href: "/dashboard/payments" },
    { label: "Net Cash Flow", value: formatCurrencyCompact(data.netCashFlow), icon: data.netCashFlow >= 0 ? TrendingUp : TrendingDown, gradient: data.netCashFlow >= 0 ? "from-sky-500 to-blue-600" : "from-rose-500 to-red-600", sub: "this month", href: "/dashboard/payments" },
    { label: "Outstanding Rent", value: formatCurrencyCompact(data.outstandingRent), icon: AlertCircle, gradient: data.outstandingRent > data.monthlyRentExpected * 0.1 ? "from-red-500 to-rose-600" : "from-amber-500 to-orange-600", sub: data.outstandingRent > data.monthlyRentExpected * 0.1 ? "⚠ needs attention" : "on track", href: "/dashboard/payments" },
    { label: "Active Tenants", value: String(data.totalTenants), icon: Users, gradient: "from-pink-500 to-rose-600", sub: `${data.occupancyRate.toFixed(0)}% occupancy`, href: "/dashboard/tenants" },
    { label: "Total Expenses", value: formatCurrencyCompact(data.totalExpensesAllTime), icon: TrendingDown, gradient: "from-slate-500 to-slate-700", sub: "all time", href: "/dashboard/expenses" },
  ];

  return (
    <div
      ref={dashboardRef}
      className="space-y-6 transition-all duration-700"
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            {data.lastUpdated && (
              <span className="ml-2 text-slate-300">· updated {timeAgo(data.lastUpdated)}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 transition-colors shadow-sm"
          >
            <FileDown size={15} />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map(({ label, value, icon: Icon, gradient, sub, href }, i) => (
          <button
            key={label}
            onClick={() => router.push(href)}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-lg text-left hover:scale-[1.03] hover:shadow-xl transition-all duration-200 cursor-pointer`}
            style={{ transitionDelay: `${i * 60}ms`, opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.95)", transition: "opacity 0.5s ease, transform 0.5s ease, box-shadow 0.2s ease" }}
          >
            <div className="absolute -right-3 -top-3 opacity-20 pointer-events-none">
              <Icon size={56} strokeWidth={1.5} />
            </div>
            <p className="text-xs font-medium text-white/70 mb-1">{label}</p>
            <p className="text-sm font-bold leading-tight break-all">{value}</p>
            <p className="text-xs text-white/60 mt-1">{sub}</p>
          </button>
        ))}
      </div>

      {/* Wave Chart — full width with range picker */}
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-0 pt-5 px-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-800">Monthly Financials</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">Real rent collected vs expenses over time</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-indigo-500 inline-block" />Rent</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-rose-400 inline-block" />Expenses</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-emerald-500 inline-block" />Cash Flow</span>
              </div>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
                {RANGES.map(r => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-3 py-1.5 font-medium transition-colors ${range === r ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-2 pb-4">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={waveData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gRent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gCF" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.1)", fontSize: 12 }}
                formatter={(v) => formatCurrency(Number(v))}
              />
              <Area type="monotone" dataKey="rent" stroke="#6366f1" strokeWidth={2.5} fill="url(#gRent)" dot={false} activeDot={{ r: 5, fill: "#6366f1" }} />
              <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gExp)" dot={false} activeDot={{ r: 5, fill: "#f43f5e" }} />
              <Area type="monotone" dataKey="cashFlow" stroke="#10b981" strokeWidth={2.5} fill="url(#gCF)" dot={false} activeDot={{ r: 5, fill: "#10b981" }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Property Breakdown — full width grouped bar */}
      {data.propertyBreakdown.length > 0 && (
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-0 pt-5 px-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-800">Property Performance</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">Rent income vs expenses per property</p>
              </div>
              <button onClick={() => router.push("/dashboard/properties")} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                View all <ChevronRight size={13} />
              </button>
            </div>
          </CardHeader>
          <CardContent className="px-2 pt-2 pb-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.propertyBreakdown} barGap={4} margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.1)", fontSize: 12 }} formatter={(v) => formatCurrency(Number(v))} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="rent" name="Rent" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={28} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Row: Rent Pie + Occupancy Radial + Unit Donut */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-slate-700">Rent Collection</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={rentPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  {rentPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }} formatter={(v) => formatCurrency(Number(v))} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-slate-700">Occupancy Rate</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center px-2">
            <div className="relative w-full">
              <ResponsiveContainer width="100%" height={190}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="62%" outerRadius="88%" startAngle={90} endAngle={-270} data={radialData}>
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "#f1f5f9" }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-indigo-600">{data.occupancyRate.toFixed(0)}%</span>
                <span className="text-xs text-slate-400 mt-0.5">occupied</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-1 pb-2">{data.occupiedUnits} of {data.totalUnits} units</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-slate-700">Unit Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={occupancyPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  {occupancyPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Row: Upcoming Dues + Expiring Leases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming Dues */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock size={14} className="text-amber-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-700">Due in Next 7 Days</CardTitle>
              </div>
              <button onClick={() => router.push("/dashboard/payments")} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                View all <ChevronRight size={13} />
              </button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {data.upcomingDues.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No payments due in the next 7 days</p>
            ) : (
              <div className="space-y-2.5">
                {data.upcomingDues.map((due, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{due.tenantName}</p>
                      <p className="text-xs text-slate-400 truncate">{due.propertyName} · {new Date(due.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(due.status)}`}>{due.status}</span>
                      <span className="text-sm font-semibold text-slate-800">{formatCurrency(due.amountDue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Leases */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                  <CalendarX size={14} className="text-red-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-700">Leases Expiring Soon</CardTitle>
              </div>
              <button onClick={() => router.push("/dashboard/tenants")} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                View all <ChevronRight size={13} />
              </button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {data.expiringLeases.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No leases expiring in the next 60 days</p>
            ) : (
              <div className="space-y-2.5">
                {data.expiringLeases.map((lease, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{lease.tenantName}</p>
                      <p className="text-xs text-slate-400 truncate">{lease.propertyName} · expires {new Date(lease.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                    <span className={`ml-3 shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold ${lease.daysLeft <= 14 ? "bg-red-100 text-red-700" : lease.daysLeft <= 30 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                      {lease.daysLeft}d left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expenses by Category */}
      {expensesBar.length > 0 && (
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-0 pt-5 px-6">
            <CardTitle className="text-base font-semibold text-slate-800">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pt-2 pb-4">
            <ResponsiveContainer width="100%" height={Math.max(expensesBar.length * 44, 180)}>
              <BarChart data={expensesBar} layout="vertical" barSize={22} margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} width={110} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }} formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {expensesBar.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
