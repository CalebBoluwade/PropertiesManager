import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { getDataMode } from "@/lib/data-mode";

export default async function DashboardLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const [session, dataMode] = await Promise.all([auth(), getDataMode()]);

  return (
    <DashboardShell user={session?.user} dataMode={dataMode} modal={modal}>
      {children}
    </DashboardShell>
  );
}
