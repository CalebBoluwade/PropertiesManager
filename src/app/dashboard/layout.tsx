import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const session = await auth();

  return (
    <DashboardShell user={session?.user} modal={modal}>
      {children}
    </DashboardShell>
  );
}
