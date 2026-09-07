import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <h1 className="text-6xl font-bold text-foreground">404</h1>
      <p className="text-muted-foreground text-lg">Payment not found</p>
      <Link
        href="/dashboard/payments"
        className="text-sm underline underline-offset-4 text-foreground hover:text-muted-foreground transition-colors"
      >
        Back to payments
      </Link>
    </div>
  );
}
