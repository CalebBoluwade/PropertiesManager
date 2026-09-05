import Link from "next/link";
import { Building2, BarChart3, Users, Wallet, ArrowRight, CheckCircle2 } from "lucide-react";

const FEATURES = [
  {
    icon: Building2,
    title: "Portfolio overview",
    desc: "Track all your properties, units, and occupancy in one place.",
  },
  {
    icon: Users,
    title: "Tenant management",
    desc: "Manage leases, contacts, and renewal timelines effortlessly.",
  },
  {
    icon: Wallet,
    title: "Rent & payments",
    desc: "Log payments, flag overdue rent, and stay on top of cash flow.",
  },
  {
    icon: BarChart3,
    title: "Financial reports",
    desc: "12-month income vs. expense history with per-property breakdowns.",
  },
];

const HIGHLIGHTS = [
  "No spreadsheets",
  "Real-time occupancy rates",
  "Expense tracking by category",
  "Lease expiry alerts",
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-zinc-100 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
              <Building2 size={14} className="text-white dark:text-zinc-900" />
            </div>
            <span className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Holding
            </span>
          </div>
          <Link
            href="/signin"
            className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
          >
            Sign in →
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1 text-xs text-zinc-500 dark:text-zinc-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Property management, simplified
          </div>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.1] mb-5">
            Your entire portfolio,
            <br />
            <span className="text-zinc-400 dark:text-zinc-500">one dashboard.</span>
          </h1>
          <p className="max-w-lg mx-auto text-lg text-zinc-500 dark:text-zinc-400 mb-10">
            Holding gives landlords and property managers a clean, fast way to
            track properties, tenants, rent, and expenses — without the chaos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signin"
              className="flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-50 px-6 py-3 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
            >
              Get started free
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 px-6 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              View demo
            </Link>
          </div>

          {/* Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-10">
            {HIGHLIGHTS.map((h) => (
              <span key={h} className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                <CheckCircle2 size={14} className="text-emerald-500" />
                {h}
              </span>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-5"
              >
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mb-4">
                  <Icon size={17} className="text-zinc-700 dark:text-zinc-300" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
                  {title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-zinc-100 dark:border-zinc-900">
          <div className="max-w-5xl mx-auto px-6 py-20 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
              Ready to take control?
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8">
              Sign in with Google and have your portfolio set up in minutes.
            </p>
            <Link
              href="/signin"
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-50 px-6 py-3 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
            >
              Sign in with Google
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-100 dark:border-zinc-900 py-6">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-xs text-zinc-400">
          <span>© {new Date().getFullYear()} Holding</span>
          <span>Built with Next.js</span>
        </div>
      </footer>
    </div>
  );
}
