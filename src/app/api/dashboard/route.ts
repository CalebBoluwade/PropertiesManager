import { db } from "@/db";
import { gte } from "drizzle-orm";
import { expenses, rentObligations } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch all data needed for dashboard
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const [
      properties,
      tenants,
      expensesList,
      obligationsList,
      allExpenses,
      allObligations,
    ] = await Promise.all([
      db.query.properties.findMany({ with: { units: true } }),
      db.query.tenants.findMany(),
      db.query.expenses.findMany({
        where: gte(expenses.expenseDate, currentMonthStart),
      }),
      db.query.rentObligations.findMany({
        where: gte(rentObligations.dueDate, currentMonthStart),
      }),
      db.query.expenses.findMany(),
      db.query.rentObligations.findMany(),
    ]);

    // Calculate basic metrics
    const portfolioValue = properties.reduce(
      (sum, p) => sum + Number(p.currentValue ?? 0),
      0
    );

    const monthlyRentExpected = tenants.reduce(
      (acc, curr) => acc + curr.monthlyRent,
      0
    );

    const totalUnits = properties.reduce((sum, p) => sum + p.units.length, 0);
    const occupiedUnits = properties.reduce(
      (sum, p) => sum + p.units.filter((u) => u.status === "OCCUPIED").length,
      0
    );
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    const outstandingRent = obligationsList
      .filter((o) => o.status === "OVERDUE" || o.status === "PENDING" || o.status === "DUE")
      .reduce((acc, curr) => acc + Math.max(0, curr.amountDue - curr.amountPaid), 0);

    const monthlyExpenses = expensesList.reduce((acc, curr) => acc + curr.amount, 0);

    const netCashFlow = monthlyRentExpected - outstandingRent - monthlyExpenses;

    // Calculate all-time metrics
    const totalExpensesAllTime = allExpenses.reduce((sum, e) => sum + e.amount, 0);

    const paidRent = allObligations
      .filter((r) => r.status === "PAID")
      .reduce((sum, r) => sum + r.amountDue, 0);

    const pendingRent = allObligations
      .filter((r) => r.status === "PENDING" || r.status === "DUE")
      .reduce((sum, r) => sum + (r.amountDue - r.amountPaid), 0);

    const overdueRent = allObligations
      .filter((r) => r.status === "OVERDUE")
      .reduce((sum, r) => sum + (r.amountDue - r.amountPaid), 0);

    // Expenses by category
    const expensesByCategory: Record<string, number> = {};
    allExpenses.forEach((e) => {
      expensesByCategory[e.category] =
        (expensesByCategory[e.category] || 0) + e.amount;
    });

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
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
