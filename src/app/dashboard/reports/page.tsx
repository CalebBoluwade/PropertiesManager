import { db } from "@/db";
import { money } from "@/lib/fx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ReportsPage() {
  // Fetch all data needed for reports
  const [properties, tenants, rentObligations, expenses] = await Promise.all([
    db.query.properties.findMany({ with: { units: true } }),
    db.query.tenants.findMany(),
    db.query.rentObligations.findMany(),
    db.query.expenses.findMany(),
  ]);

  // Calculate metrics
  const totalProperties = properties.length;
  const totalUnits = properties.reduce((sum, p) => sum + p.units.length, 0);
  const occupiedUnits = properties.reduce(
    (sum, p) => sum + p.units.filter((u) => u.status === "OCCUPIED").length,
    0
  );
  const occupancyRate =
    totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : "0";

  const portfolioValue = properties.reduce(
    (sum, p) => sum + Number(p.currentValue ?? 0),
    0
  );

  const totalTenants = tenants.length;

  const paidRent = rentObligations
    .filter((r) => r.status === "PAID")
    .reduce((sum, r) => sum + r.amountDue, 0);

  const pendingRent = rentObligations
    .filter((r) => r.status === "PENDING" || r.status === "DUE")
    .reduce((sum, r) => sum + (r.amountDue - r.amountPaid), 0);

  const overdueRent = rentObligations
    .filter((r) => r.status === "OVERDUE")
    .reduce((sum, r) => sum + (r.amountDue - r.amountPaid), 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate monthly breakdown
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthlyExpenses = expenses
    .filter((e) => {
      const eDate = new Date(e.expenseDate);
      return eDate.getMonth() === currentMonth && eDate.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const expensesByCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
  });

  return (
    <div className="p-5 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="mt-2 text-slate-500">
          Overview of your property portfolio performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Units
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Occupancy Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
            <p className="text-xs text-slate-500 mt-1">
              {occupiedUnits} of {totalUnits} units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {money(portfolioValue, "NGN")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rent Summary */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Rent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {money(paidRent, "NGN")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Rent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {money(pendingRent, "NGN")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue Rent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {money(overdueRent, "NGN")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Summary */}
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses (All Time)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{money(totalExpenses, "NGN")}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{money(monthlyExpenses, "NGN")}</div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(expensesByCategory).length > 0 ? (
              Object.entries(expensesByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {category.replaceAll("_", " ")}
                    </span>
                    <span className="font-semibold">
                      {money(amount, "NGN")}
                    </span>
                  </div>
                ))
            ) : (
              <p className="text-sm text-slate-500">No expenses recorded</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tenant Summary */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalTenants} active tenants</div>
        </CardContent>
      </Card>
    </div>
  );
}
