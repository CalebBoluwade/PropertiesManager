"use client";

const Spinner = () => (
  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

export function FormActions({
  pending,
  submitLabel,
  pendingLabel,
  onCancel,
}: Readonly<{
  pending: boolean;
  submitLabel: string;
  pendingLabel: string;
  onCancel: () => void;
}>) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 transition-colors"
      >
        {pending && <Spinner />}
        {pending ? pendingLabel : submitLabel}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={onCancel}
        className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
