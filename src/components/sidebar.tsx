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
  mobile?: boolean;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Sidebar({ onNavigate, mobile, user }: Readonly<SidebarProps>) {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-ink/60 backdrop-blur-sm">
          <Loader2 size={32} className="animate-spin text-zinc-900 dark:text-zinc-50" />
        </div>
      )}

      <div className="flex h-full w-full flex-col bg-zinc-900 text-paper">
        {/* Logo */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4 shrink-0">
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex items-baseline gap-1.5 min-w-0"
          >
            <span className="w-6 h-6 rounded-md bg-paper/10 flex items-center justify-center shrink-0 text-paper font-bold text-xs">H</span>
            <span className={cn("font-display text-xl font-medium tracking-tight truncate", !mobile && "hidden lg:inline")}>Holding</span>
            <span className={cn("w-1.5 h-1.5 rounded-full bg-ledger-amber translate-y-[-2px] shrink-0", !mobile && "hidden lg:inline-block")} />
          </Link>
          {mobile && (
            <button
              className="text-paper/70 hover:text-paper shrink-0"
              onClick={onNavigate}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 lg:px-3 space-y-0.5 overflow-visible">
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
                  "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                  mobile && "px-4 py-3 text-base",
                  active
                    ? "bg-paper text-ink font-medium"
                    : "text-paper/70 hover:bg-paper/10 hover:text-paper"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-amber-400" />
                )}
                <Icon size={mobile ? 20 : 17} strokeWidth={2} className="shrink-0" />
                <span className={cn(!mobile && "hidden lg:inline")}>{item.label}</span>
                {!mobile && (
                  <span className="pointer-events-none absolute left-full ml-2 hidden md:group-hover:flex lg:hidden items-center whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1.5 text-xs text-white shadow-lg z-50">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-paper/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "User avatar"}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full shrink-0 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 text-white text-xs font-semibold">
                {initials}
              </div>
            )}
            <div className={cn("flex flex-col min-w-0 flex-1", !mobile && "hidden lg:flex")}>
              <p className="text-sm font-medium text-paper/80 truncate">{user?.name ?? "—"}</p>
              <p className="text-xs text-paper/40 truncate">{user?.email ?? "—"}</p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className={cn("text-paper/40 hover:text-paper/80 transition-colors shrink-0", !mobile && "hidden lg:flex")}
            >
              <LogOut size={16} />
            </button>
          </div>
          {!mobile && (
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="hidden md:flex lg:hidden mt-3 text-paper/40 hover:text-paper/80 transition-colors mx-auto"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
