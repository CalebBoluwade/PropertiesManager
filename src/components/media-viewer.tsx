"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type Props = Readonly<{
  src: string;
  mime?: string | null;
  caption?: string | null;
  onClose: () => void;
}>;

export function MediaViewer({ src, mime, caption, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const isVideo = mime?.startsWith("video/");
  const isPdf = mime === "application/pdf";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="relative max-h-[90vh] max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute -top-9 right-0 text-white/80 hover:text-white flex items-center gap-1 text-sm">
          <X size={16} /> Close
        </button>

        {isVideo ? (
          <video src={src} controls autoPlay className="max-h-[80vh] w-full rounded-xl" />
        ) : isPdf ? (
          <iframe src={src} className="h-[80vh] w-full rounded-xl bg-white" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={caption ?? ""} className="max-h-[80vh] w-full rounded-xl object-contain" />
        )}

        {caption && (
          <p className="mt-2 text-center text-sm text-white/70">{caption}</p>
        )}
      </div>
    </div>
  );
}
