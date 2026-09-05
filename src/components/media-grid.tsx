"use client";

import { useState } from "react";
import { FileText, Film } from "lucide-react";
import { MediaViewer } from "./media-viewer";

type MediaItem = {
  id: string;
  url: string;
  mime?: string | null;
  caption?: string | null;
};

export function MediaGrid({ items }: { items: MediaItem[] }) {
  const [active, setActive] = useState<MediaItem | null>(null);

  if (!items.length) return null;

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {items.map((item) => {
          const isVideo = item.mime?.startsWith("video/");
          const isPdf = item.mime === "application/pdf";
          const isDoc = isPdf || (!isVideo && !item.mime?.startsWith("image/"));

          return (
            <button key={item.id} type="button" onClick={() => setActive(item)}
              className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 hover:opacity-90 transition-opacity">
              {isVideo ? (
                <>
                  <video src={item.url} className="h-full w-full object-cover" muted />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Film size={22} className="text-white" />
                  </div>
                </>
              ) : isDoc ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2">
                  <FileText size={28} className="text-slate-400" />
                  <span className="text-[10px] text-slate-400 text-center leading-tight line-clamp-2">{item.caption ?? "Document"}</span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt={item.caption ?? ""} className="h-full w-full object-cover" />
              )}
            </button>
          );
        })}
      </div>

      {active && (
        <MediaViewer src={active.url} mime={active.mime} caption={active.caption} onClose={() => setActive(null)} />
      )}
    </>
  );
}
