"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Wallet,
  Receipt,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/properties", label: "Properties", icon: Building2 },
  { href: "/dashboard/tenants", label: "Tenants", icon: Users },
  { href: "/dashboard/payments", label: "Rent & payments", icon: Wallet },
  { href: "/dashboard/expenses", label: "Expenses", icon: Receipt },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-ink text-paper">
      <div className="flex items-center justify-between px-5 pt-6 pb-5">
        <Link href="/dashboard" className="flex items-baseline gap-1.5" onClick={onNavigate}>
          <span className="font-display text-xl font-medium tracking-tight">Holding</span>
          <span className="w-1.5 h-1.5 rounded-full bg-ledger-amber translate-y-[-2px]" />
        </Link>
        <button
          className="md:hidden text-paper/70 hover:text-paper"
          onClick={onNavigate}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map((item) => {
          const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm transition-colors",
                active ? "bg-paper text-ink font-medium" : "text-paper/75 hover:bg-ink-2 hover:text-paper"
              )}
            >
              <Icon size={16} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-5 border-t border-paper/10">
        <p className="text-[0.7rem] text-paper/50 leading-relaxed">
          Portfolio records stored locally in SQLite.
        </p>
      </div>
    </div>
  );
}