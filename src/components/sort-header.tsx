"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export function SortHeader({ column, label }: { column: string; label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort");
  const currentDir = searchParams.get("dir") ?? "asc";

  const isActive = currentSort === column;
  const nextDir = isActive && currentDir === "asc" ? "desc" : "asc";

  function handleClick() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", column);
    params.set("dir", nextDir);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <button onClick={handleClick} className="flex items-center gap-1 hover:text-slate-700 transition-colors">
      {label}
      {isActive ? (
        currentDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}
