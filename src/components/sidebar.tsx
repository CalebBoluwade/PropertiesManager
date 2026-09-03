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

export function Sidebar({ onNavigate }: Readonly<{ onNavigate?: () => void }>) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-ink text-paper overflow-hidden">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4 lg:px-5 lg:pt-6 lg:pb-5 shrink-0">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-baseline gap-1.5 min-w-0"
        >
          {/* Icon mark — always visible */}
          <span className="w-6 h-6 rounded-md bg-paper/10 flex items-center justify-center shrink-0 text-paper font-bold text-xs">H</span>
          {/* Full wordmark — hidden at md, shown at lg */}
          <span className="hidden lg:inline font-display text-xl font-medium tracking-tight truncate">Holding</span>
          <span className="hidden lg:inline w-1.5 h-1.5 rounded-full bg-ledger-amber translate-y-[-2px] shrink-0" />
        </Link>
        {/* Close button — mobile drawer only */}
        <button
          className="md:hidden text-paper/70 hover:text-paper shrink-0"
          onClick={onNavigate}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 lg:px-3 space-y-0.5">
        {NAV.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={item.label}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                "lg:px-3",
                active
                  ? "bg-paper text-ink font-medium"
                  : "text-paper/70 hover:bg-paper/10 hover:text-paper"
              )}
            >
              <Icon size={17} strokeWidth={2} className="shrink-0" />
              {/* Label — hidden at md, shown at lg and mobile */}
              <span className="lg:inline md:hidden">{item.label}</span>
              {/* Tooltip for icon-only state at md */}
              <span className="pointer-events-none absolute left-full ml-2 hidden md:group-hover:flex lg:hidden items-center whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1.5 text-xs text-white shadow-lg z-50">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer — profile */}
      <div className="px-3 py-4 border-t border-paper/10 shrink-0 lg:px-4 lg:py-4">
        {/* Collapsed: avatar only */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 text-white text-xs font-semibold">
            C
          </div>
          <div className="hidden lg:block min-w-0">
            <p className="text-xs font-medium text-paper/80 truncate">Caleb Boluwade</p>
            <p className="text-[0.65rem] text-paper/40 truncate">caleb@holding.app</p>
          </div>
        </div>
      </div>
    </div>
  );
}
