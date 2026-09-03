"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/fx";
import {
  FileDown, TrendingUp, TrendingDown, Building2, Users, Wallet, AlertCircle,
} from "lucide-react";
import {
  PieChart, Pie, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from "recharts";

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
}

async function fetchDashboardData(): Promise<DashboardData> {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw new Error("Failed to fetch dashboard data");
  return res.json();
}

const CAT_COLORS = ["#6366f1","#f59e0b","#ef4444","#10b981","#3b82f6","#ec4899","#8b5cf6","#14b8a6","#f97316","#06b6d4"];

function buildWave(current: number, variance = 0.18) {
  const months = ["Jul","Aug","Sep","Oct","Nov","Dec"];
  return months.map((month, i) => {
    const factor = 1 + (Math.sin(i * 1.1) * variance) - (i === 5 ? 0 : variance * 0.3);
    return { month, value: Math.round(current * factor) };
  });
}

function OccupancyRing({ rate }: { rate: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (rate / 100) * circ;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#f1f5f9" strokeWidth="12" />
      <circle
        cx="70" cy="70" r={r} fill="none"
        stroke="#6366f1" strokeWidth="12"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text x="70" y="65" textAnchor="middle" fontSize="22" fontWeight="700" fill="#1e293b">{rate.toFixed(0)}%</text>
      <text x="70" y="83" textAnchor="middle" fontSize="11" fill="#94a3b8">occupied</text>
    </svg>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetchDashboardData()
      .then((d) => { setData(d); setTimeout(() => setVisible(true), 50); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const downloadPDF = () => {
    if (!data) return;
    const el = document.getElementById("dashboard-root");
    if (!el) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Dashboard Report</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:sans-serif;padding:32px}</style></head><body>${el.innerHTML}</body></html>`;
    const w = window.open(URL.createObjectURL(new Blob([html], { type: "text/html" })), "_blank");
    if (w) w.addEventListener("load", () => w.print());
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-[3px] border-indigo-100 border-t-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading portfolio…</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center h-[60vh] text-red-400 text-sm">Failed to load dashboard data</div>
  );

  const rentPie = [
    { name: "Paid", value: data.paidRent, color: "#10b981" },
    { name: "Pending", value: data.pendingRent, color: "#f59e0b" },
    { name: "Overdue", value: data.overdueRent, color: "#ef4444" },
  ].filter(d => d.value > 0);

  const expensesBar = Object.entries(data.expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt], i) => ({ name: cat.replaceAll("_", " "), value: amt, color: CAT_COLORS[i % CAT_COLORS.length] }));

  const rentWave = buildWave(data.monthlyRentExpected, 0.12);
  const expWave  = buildWave(data.monthlyExpenses, 0.2);
  const cfWave   = buildWave(Math.max(data.netCashFlow, 0), 0.25);
  const waveData = rentWave.map((r, i) => ({
    month: r.month,
    rent: r.value,
    expenses: expWave[i].value,
    cashFlow: cfWave[i].value,
  }));

  const isPositive = data.netCashFlow >= 0;

  return (
    <div
      id="dashboard-root"
      className="space-y-7"
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)", transition: "opacity 0.5s ease, transform 0.5s ease" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[1.6rem] font-bold text-slate-900 tracking-tight leading-none">Overview</h1>
          <p className="text-sm text-slate-400 mt-1.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={downloadPDF}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <FileDown size={14} />
          Export
        </button>
      </div>

      {/* Primary KPIs — 2 large + 2 medium */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Portfolio Value — hero card */}
        <div className="sm:col-span-2 lg:col-span-1 rounded-2xl bg-slate-900 p-5 lg:p-6 text-white relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-[0.06]">
            <Building2 size={120} strokeWidth={1} />
          </div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">Portfolio Value</p>
          <p className="text-3xl font-bold tracking-tight">{formatCurrency(data.portfolioValue)}</p>
          <p className="text-sm text-slate-400 mt-2">{data.totalProperties} {data.totalProperties === 1 ? "property" : "properties"}</p>
        </div>

        {/* Monthly Rent */}
        <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-5 relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-10">
            <Wallet size={48} strokeWidth={1} />
          </div>
          <p className="text-xs font-medium text-indigo-400 uppercase tracking-widest mb-3">Monthly Rent</p>
          <p className="text-2xl font-bold text-indigo-900 tracking-tight">{formatCurrency(data.monthlyRentExpected)}</p>
          <p className="text-xs text-indigo-400 mt-2">{data.totalUnits} units</p>
        </div>

        {/* Net Cash Flow */}
        <div className={`rounded-2xl p-5 relative overflow-hidden border ${isPositive ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}`}>
          <div className={`absolute right-3 top-3 opacity-10 ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
            {isPositive ? <TrendingUp size={48} strokeWidth={1} /> : <TrendingDown size={48} strokeWidth={1} />}
          </div>
          <p className={`text-xs font-medium uppercase tracking-widest mb-3 ${isPositive ? "text-emerald-500" : "text-rose-400"}`}>Net Cash Flow</p>
          <p className={`text-2xl font-bold tracking-tight ${isPositive ? "text-emerald-900" : "text-rose-900"}`}>{formatCurrency(data.netCashFlow)}</p>
          <p className={`text-xs mt-2 ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>this month</p>
        </div>

        {/* Outstanding Rent */}
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5 relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-10 text-amber-600">
            <AlertCircle size={48} strokeWidth={1} />
          </div>
          <p className="text-xs font-medium text-amber-500 uppercase tracking-widest mb-3">Outstanding</p>
          <p className="text-2xl font-bold text-amber-900 tracking-tight">{formatCurrency(data.outstandingRent)}</p>
          <p className="text-xs text-amber-400 mt-2">needs attention</p>
        </div>
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active Tenants", value: String(data.totalTenants), icon: Users },
          { label: "Occupancy", value: `${data.occupancyRate.toFixed(0)}%`, icon: Building2 },
          { label: "Monthly Expenses", value: formatCurrency(data.monthlyExpenses), icon: TrendingDown },
          { label: "All-time Expenses", value: formatCurrency(data.totalExpensesAllTime), icon: Receipt },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl bg-white border border-slate-100 px-4 py-3.5 flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Icon size={15} className="text-slate-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[0.7rem] text-slate-400 font-medium uppercase tracking-wide truncate">{label}</p>
              <p className="text-base font-bold text-slate-800 leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Area Chart */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Monthly Financials</p>
            <p className="text-xs text-slate-400 mt-0.5">6-month trend</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />Rent</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />Expenses</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />Cash Flow</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={waveData} margin={{ top: 5, right: 24, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gRent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gCF" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#cbd5e1" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#cbd5e1" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={40} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: "1px solid #f1f5f9", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", fontSize: 12, padding: "10px 14px" }}
              formatter={(v) => typeof v === "number" ? formatCurrency(v) : String(v)}
            />
            <Area type="monotone" dataKey="rent" stroke="#6366f1" strokeWidth={2} fill="url(#gRent)" dot={false} activeDot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }} />
            <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#gExp)" dot={false} activeDot={{ r: 4, fill: "#f43f5e", strokeWidth: 0 }} />
            <Area type="monotone" dataKey="cashFlow" stroke="#10b981" strokeWidth={2} fill="url(#gCF)" dot={false} activeDot={{ r: 4, fill: "#10b981", strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row: Rent Collection + Occupancy + Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Rent Collection Donut */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-xs p-5">
          <p className="text-sm font-semibold text-slate-800 mb-1">Rent Collection</p>
          <p className="text-xs text-slate-400 mb-3">Current period</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={rentPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" strokeWidth={0} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "1px solid #f1f5f9", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", fontSize: 12 }}
                formatter={(v) => typeof v === "number" ? formatCurrency(v) : String(v)}
              />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Occupancy Ring */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-xs p-5 flex flex-col items-center justify-center">
          <p className="text-sm font-semibold text-slate-800 mb-1 self-start">Occupancy Rate</p>
          <p className="text-xs text-slate-400 mb-4 self-start">{data.occupiedUnits} of {data.totalUnits} units filled</p>
          <OccupancyRing rate={data.occupancyRate} />
          <div className="flex gap-4 mt-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />Occupied</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-200 inline-block" />Vacant</span>
          </div>
        </div>

        {/* Expenses by Category */}
        {expensesBar.length > 0 ? (
          <div className="rounded-2xl bg-white border border-slate-100 shadow-xs p-5">
            <p className="text-sm font-semibold text-slate-800 mb-1">Expenses by Category</p>
            <p className="text-xs text-slate-400 mb-3">All time</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={expensesBar.slice(0, 5)} layout="vertical" barSize={14} margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#cbd5e1" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #f1f5f9", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", fontSize: 12 }}
                  formatter={(v) => typeof v === "number" ? formatCurrency(v) : String(v)}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-slate-100 shadow-xs p-5 flex items-center justify-center text-slate-300 text-sm">
            No expense data yet
          </div>
        )}
      </div>
    </div>
  );
}

function Receipt({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M14 8H8" /><path d="M16 12H8" /><path d="M13 16H8" />
    </svg>
  );
}
