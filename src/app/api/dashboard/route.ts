import { db } from "@/db";
import { gte, lte, and } from "drizzle-orm";
import { expenses, rentObligations, leases, payments } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 12-month window
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // 7-day window for upcoming dues
    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);

    // 60-day window for expiring leases
    const in60Days = new Date(now);
    in60Days.setDate(in60Days.getDate() + 60);

    const [
      properties,
      tenants,
      expensesList,
      obligationsList,
      allExpenses,
      allObligations,
      historicPayments,
      historicExpenses,
      upcomingObligations,
      expiringLeases,
    ] = await Promise.all([
      db.query.properties.findMany({ with: { units: true } }),
      db.query.tenants.findMany(),
      db.query.expenses.findMany({ where: gte(expenses.expenseDate, currentMonthStart) }),
      db.query.rentObligations.findMany({ where: gte(rentObligations.dueDate, currentMonthStart) }),
      db.query.expenses.findMany(),
      db.query.rentObligations.findMany(),
      // Real 12-month payment history
      db.query.payments.findMany({
        where: gte(payments.createdAt, twelveMonthsAgo),
      }),
      // Real 12-month expense history
      db.query.expenses.findMany({
        where: gte(expenses.expenseDate, twelveMonthsAgo),
      }),
      // Upcoming dues in next 7 days
      db.query.rentObligations.findMany({
        where: and(
          gte(rentObligations.dueDate, now),
          lte(rentObligations.dueDate, in7Days)
        ),
        with: { property: true, lease: { with: { tenant: true } } },
        orderBy: [rentObligations.dueDate],
      }),
      // Leases expiring in 60 days
      db.query.leases.findMany({
        where: and(
          gte(leases.endDate, now),
          lte(leases.endDate, in60Days),
          // only active leases
        ),
        with: { tenant: true, property: true },
        orderBy: [leases.endDate],
      }),
    ]);

    // --- Core metrics ---
    const portfolioValue = properties.reduce((sum, p) => sum + Number(p.currentValue ?? 0), 0);
    const monthlyRentExpected = tenants.reduce((acc, t) => acc + t.monthlyRent, 0);
    const totalUnits = properties.reduce((sum, p) => sum + p.units.length, 0);
    const occupiedUnits = properties.reduce((sum, p) => sum + p.units.filter(u => u.status === "OCCUPIED").length, 0);
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
    const outstandingRent = obligationsList
      .filter(o => ["OVERDUE","PENDING","DUE"].includes(o.status))
      .reduce((acc, o) => acc + Math.max(0, o.amountDue - o.amountPaid), 0);
    const monthlyExpenses = expensesList.reduce((acc, e) => acc + e.amount, 0);
    const netCashFlow = monthlyRentExpected - outstandingRent - monthlyExpenses;
    const totalExpensesAllTime = allExpenses.reduce((sum, e) => sum + e.amount, 0);
    const paidRent = allObligations.filter(r => r.status === "PAID").reduce((sum, r) => sum + r.amountDue, 0);
    const pendingRent = allObligations.filter(r => ["PENDING","DUE"].includes(r.status)).reduce((sum, r) => sum + (r.amountDue - r.amountPaid), 0);
    const overdueRent = allObligations.filter(r => r.status === "OVERDUE").reduce((sum, r) => sum + (r.amountDue - r.amountPaid), 0);
    const expensesByCategory: Record<string, number> = {};
    allExpenses.forEach(e => { expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount; });

    // --- 12-month history (real data) ---
    const monthlyHistory: Record<string, { rent: number; expenses: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyHistory[key] = { rent: 0, expenses: 0 };
    }

    allObligations
      .filter(o => o.status === "PAID")
      .forEach(o => {
        const d = new Date(o.dueDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (monthlyHistory[key]) monthlyHistory[key].rent += o.amountDue;
      });

    historicExpenses.forEach(e => {
      const d = new Date(e.expenseDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyHistory[key]) monthlyHistory[key].expenses += e.amount;
    });

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const rentExpenseHistory = Object.entries(monthlyHistory).map(([key, val]) => {
      const [, month] = key.split("-");
      return {
        month: monthNames[parseInt(month) - 1],
        rent: val.rent,
        expenses: val.expenses,
        cashFlow: Math.max(0, val.rent - val.expenses),
      };
    });

    // --- Property breakdown ---
    const propertyBreakdown = properties.map(p => {
      const propTenants = tenants.filter(t => t.propertyId === p.id);
      const propExpenses = allExpenses.filter(e => e.propertyId === p.id).reduce((s, e) => s + e.amount, 0);
      const propRent = propTenants.reduce((s, t) => s + t.monthlyRent, 0);
      const propOccupied = p.units.filter(u => u.status === "OCCUPIED").length;
      return {
        name: p.name.length > 18 ? p.name.slice(0, 16) + "…" : p.name,
        rent: propRent,
        expenses: propExpenses,
        units: p.units.length,
        occupied: propOccupied,
      };
    }).sort((a, b) => b.rent - a.rent);

    // --- Upcoming dues (next 7 days) ---
    const upcomingDues = upcomingObligations
      .filter(o => ["DUE","PENDING","OVERDUE"].includes(o.status))
      .slice(0, 8)
      .map(o => ({
        tenantName: o.lease?.tenant?.name ?? "Unknown",
        propertyName: o.property?.name ?? "Unknown",
        amountDue: o.amountDue - o.amountPaid,
        dueDate: o.dueDate.toISOString(),
        status: o.status,
      }));

    // --- Expiring leases ---
    const expiringLeasesData = expiringLeases
      .filter(l => l.status === "ACTIVE")
      .slice(0, 6)
      .map(l => ({
        tenantName: l.tenant?.name ?? "Unknown",
        propertyName: l.property?.name ?? "Unknown",
        endDate: l.endDate.toISOString(),
        daysLeft: Math.ceil((l.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      }));

    return NextResponse.json({
      portfolioValue,
      monthlyRentExpected,
      occupancyRate,
      occupiedUnits,
      totalUnits,
      outstandingRent,
      monthlyExpenses,
      netCashFlow,
      totalProperties: properties.length,
      totalTenants: tenants.length,
      paidRent,
      pendingRent,
      overdueRent,
      totalExpensesAllTime,
      expensesByCategory,
      rentExpenseHistory,
      propertyBreakdown,
      upcomingDues,
      expiringLeases: expiringLeasesData,
      lastUpdated: now.toISOString(),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
