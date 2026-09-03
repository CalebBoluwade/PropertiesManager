"use client";

import { Sidebar } from "@/components/sidebar";
import { Menu } from "lucide-react";
import { useState } from "react";

export default function DashboardLayout({ children }: LayoutProps<"/">) {
  const [open, setOpen] = useState(false);
  
  return (
  <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:block md:w-64 md:shrink-0 md:sticky md:top-0 md:h-screen">
        <Sidebar />
      </aside>
 
      {/* Mobile topbar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-ink text-paper px-4 py-3">
        <span className="font-display text-lg font-medium">Holding</span>
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="text-paper/80 hover:text-paper">
          <Menu size={22} />
        </button>
      </div>
 
      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-72 shrink-0 h-full">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
          <button
            className="flex-1 bg-ink/40"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
        </div>
      )}
 
      <main className="flex-1 min-w-0">
        <div className="w-full px-4 py-6 md:px-6 md:py-8">{children}</div>
      </main>
    </div>
      );
}
