import { db } from "@/db";
import { money } from "@/lib/fx";

export default async function PaymentsPage() {
  const obligations = await db.query.rentObligations.findMany({
    with: { lease: { with: { tenant: true, property: true } } },
    orderBy: (obligations, { desc }) => desc(obligations.dueDate),
  });

  const statusColors: Record<string, string> = {
    PAID: "bg-green-100 text-green-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    OVERDUE: "bg-red-100 text-red-800",
    PARTIALLY_PAID: "bg-blue-100 text-blue-800",
    DUE: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="p-5 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Rent & Payments</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track all rent obligations and payments.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-4">Tenant</th>
              <th className="p-4">Property</th>
              <th className="p-4">Period</th>
              <th className="p-4">Amount Due</th>
              <th className="p-4">Amount Paid</th>
              <th className="p-4">Outstanding</th>
              <th className="p-4">Status</th>
              <th className="p-4">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {obligations.map((obligation) => {
              const outstanding = obligation.amountDue - obligation.amountPaid;
              return (
                <tr
                  key={obligation.id}
                  className="border-b last:border-0 hover:bg-slate-50"
                >
                  <td className="p-4 font-medium">
                    {obligation.lease.tenant.name}
                  </td>
                  <td className="p-4">{obligation.lease.property.name}</td>
                  <td className="p-4 text-xs text-slate-500">
                    {new Date(obligation.periodStart).toLocaleDateString()} -{" "}
                    {new Date(obligation.periodEnd).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    {money(obligation.amountDue, "NGN")}
                  </td>
                  <td className="p-4">
                    {money(obligation.amountPaid, "NGN")}
                  </td>
                  <td className={`p-4 font-medium ${outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                    {money(outstanding, "NGN")}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[obligation.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {obligation.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    {new Date(obligation.dueDate).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {!obligations.length && (
              <tr>
                <td colSpan={8} className="p-10 text-center text-slate-500">
                  No rent obligations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
