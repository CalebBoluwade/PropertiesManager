"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  Users,
  Wallet,
  Receipt,
  Settings,
  X,
  LogOut,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/properties", label: "Properties", icon: Building2 },
  { href: "/dashboard/tenants", label: "Tenants", icon: Users },
  { href: "/dashboard/payments", label: "Rent & payments", icon: Wallet },
  { href: "/dashboard/expenses", label: "Expenses", icon: Receipt },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  onNavigate?: () => void;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Sidebar({ onNavigate, user }: Readonly<SidebarProps>) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  function handleSignOut() {
    setSigningOut(true);
    signOut({ callbackUrl: "/" });
  }

  return (
    <>
      {signingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-zinc-950/60 backdrop-blur-sm">
          <Loader2 size={32} className="animate-spin text-zinc-900 dark:text-zinc-50" />
        </div>
      )}

      <div className="flex h-full flex-col bg-ink text-paper overflow-hidden">
        {/* Logo */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4 lg:px-5 lg:pt-6 lg:pb-5 shrink-0">
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex items-baseline gap-1.5 min-w-0"
          >
            <span className="w-6 h-6 rounded-md bg-paper/10 flex items-center justify-center shrink-0 text-paper font-bold text-xs">H</span>
            <span className="hidden lg:inline font-display text-xl font-medium tracking-tight truncate">Holding</span>
            <span className="hidden lg:inline w-1.5 h-1.5 rounded-full bg-ledger-amber translate-y-[-2px] shrink-0" />
          </Link>
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
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-amber-400" />
                )}
                <Icon size={17} strokeWidth={2} className="shrink-0" />
                <span className="lg:inline md:hidden">{item.label}</span>
                <span className="pointer-events-none absolute left-full ml-2 hidden md:group-hover:flex lg:hidden items-center whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1.5 text-xs text-white shadow-lg z-50">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer — user profile + sign out */}
        <div className="px-3 py-4 border-t border-paper/10 shrink-0 lg:px-4 lg:py-4">
          <div className="flex items-center gap-3 min-w-0">
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "User avatar"}
                width={28}
                height={28}
                className="w-7 h-7 rounded-full shrink-0 object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 text-white text-xs font-semibold">
                {initials}
              </div>
            )}

            <div className="hidden lg:flex lg:flex-col min-w-0 flex-1">
              <p className="text-xs font-medium text-paper/80 truncate">{user?.name ?? "—"}</p>
              <p className="text-[0.65rem] text-paper/40 truncate">{user?.email ?? "—"}</p>
            </div>

            <button
              onClick={handleSignOut}
              title="Sign out"
              className="hidden lg:flex text-paper/40 hover:text-paper/80 transition-colors shrink-0"
            >
              <LogOut size={15} />
            </button>
          </div>

          <button
            onClick={handleSignOut}
            title="Sign out"
            className="hidden md:flex lg:hidden mt-3 text-paper/40 hover:text-paper/80 transition-colors mx-auto"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  );
}
