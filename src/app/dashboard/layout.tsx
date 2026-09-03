"use client";

import { Sidebar } from "@/components/sidebar";
import { Menu } from "lucide-react";
import { useState } from "react";

export default function DashboardLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar — icon-only at md, full at lg */}
      <aside className="hidden md:flex md:flex-col md:shrink-0 md:sticky md:top-0 md:h-screen md:w-16 lg:w-60 transition-all duration-200">
        <Sidebar />
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-64 shrink-0 h-full">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
          <button
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile topbar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-ink text-paper px-4 py-3 shrink-0">
          <span className="font-display text-lg font-medium">Holding</span>
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="text-paper/80 hover:text-paper"
          >
            <Menu size={22} />
          </button>
        </header>

        <main className="flex-1 min-w-0 px-4 py-5 md:px-5 md:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      {modal}
    </div>
  );
}
