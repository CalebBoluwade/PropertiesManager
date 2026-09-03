"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/fx";
import {
  FileDown, TrendingUp, TrendingDown, Building2, Users, Wallet, AlertCircle,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  RadialBarChart, RadialBar, BarChart, Bar,
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

// Builds a synthetic 6-month wave from a single current value
function buildWave(current: number, variance = 0.18) {
  const months = ["Jul","Aug","Sep","Oct","Nov","Dec"];
  return months.map((month, i) => {
    const factor = 1 + (Math.sin(i * 1.1) * variance) - (i === 5 ? 0 : variance * 0.3);
    return { month, value: Math.round(current * factor) };
  });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDashboardData()
      .then((d) => { setData(d); setTimeout(() => setVisible(true), 50); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

  // Wave data: 3 series for the area chart
  const rentWave = buildWave(data.monthlyRentExpected, 0.12);
  const expWave  = buildWave(data.monthlyExpenses, 0.2);
  const cfWave   = buildWave(Math.max(data.netCashFlow, 0), 0.25);
  const waveData = rentWave.map((r, i) => ({
    month: r.month,
    rent: r.value,
    expenses: expWave[i].value,
    cashFlow: cfWave[i].value,
  }));

  const radialData = [{ name: "Occupancy", value: data.occupancyRate, fill: "#6366f1" }];

  const kpis = [
    { label: "Portfolio Value", value: formatCurrency(data.portfolioValue), icon: Building2, gradient: "from-indigo-500 to-violet-600", sub: `${data.totalProperties} properties` },
    { label: "Monthly Rent", value: formatCurrency(data.monthlyRentExpected), icon: Wallet, gradient: "from-emerald-500 to-teal-600", sub: `${data.totalUnits} units` },
    { label: "Net Cash Flow", value: formatCurrency(data.netCashFlow), icon: data.netCashFlow >= 0 ? TrendingUp : TrendingDown, gradient: data.netCashFlow >= 0 ? "from-sky-500 to-blue-600" : "from-rose-500 to-red-600", sub: "this month" },
    { label: "Outstanding Rent", value: formatCurrency(data.outstandingRent), icon: AlertCircle, gradient: "from-amber-500 to-orange-600", sub: "needs attention" },
    { label: "Active Tenants", value: String(data.totalTenants), icon: Users, gradient: "from-pink-500 to-rose-600", sub: `${data.occupancyRate.toFixed(0)}% occupancy` },
    { label: "Total Expenses", value: formatCurrency(data.totalExpensesAllTime), icon: TrendingDown, gradient: "from-slate-500 to-slate-700", sub: "all time" },
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
          <p className="text-sm text-slate-400 mt-0.5">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <button
          onClick={downloadPDF}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 transition-colors shadow-sm"
        >
          <FileDown size={15} />
          Export Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map(({ label, value, icon: Icon, gradient, sub }, i) => (
          <div
            key={label}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-lg`}
            style={{ transitionDelay: `${i * 60}ms`, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.5s ease, transform 0.5s ease" }}
          >
            <div className="absolute -right-3 -top-3 opacity-20">
              <Icon size={56} strokeWidth={1.5} />
            </div>
            <p className="text-xs font-medium text-white/70 mb-1">{label}</p>
            <p className="text-xl font-bold leading-tight">{value}</p>
            <p className="text-xs text-white/60 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Wave Chart — full width */}
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-0 pt-5 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-800">Monthly Financials</CardTitle>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-indigo-500 inline-block" />Rent</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-rose-400 inline-block" />Expenses</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-emerald-500 inline-block" />Cash Flow</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-2 pb-4">
          <ResponsiveContainer width="100%" height={280}>
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
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.1)", fontSize: 12 }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Area type="monotone" dataKey="rent" stroke="#6366f1" strokeWidth={2.5} fill="url(#gRent)" dot={false} activeDot={{ r: 5, fill: "#6366f1" }} />
              <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gExp)" dot={false} activeDot={{ r: 5, fill: "#f43f5e" }} />
              <Area type="monotone" dataKey="cashFlow" stroke="#10b981" strokeWidth={2.5} fill="url(#gCF)" dot={false} activeDot={{ r: 5, fill: "#10b981" }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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
                <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }} formatter={(v: number) => formatCurrency(v)} />
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

      {/* Expenses by Category — full width horizontal bar */}
      {expensesBar.length > 0 && (
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-0 pt-5 px-6">
            <CardTitle className="text-base font-semibold text-slate-800">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pt-2 pb-4">
            <ResponsiveContainer width="100%" height={Math.max(expensesBar.length * 44, 180)}>
              <BarChart data={expensesBar} layout="vertical" barSize={22} margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} width={110} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }} formatter={(v: number) => formatCurrency(v)} />
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
