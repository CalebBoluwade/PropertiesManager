"use client";

import { useRef, useState } from "react";
import { X, FileText, Film } from "lucide-react";

export type MediaFile = { url: string; file: File; mime: string };

type Props = Readonly<{
  value: MediaFile[];
  onChange: (files: MediaFile[]) => void;
  accept?: string;
  maxFiles?: number;
  maxMB?: number;
  label?: string;
}>;

export function MediaUpload({
  value,
  onChange,
  accept = "image/*,video/*,application/pdf",
  maxFiles = 10,
  maxMB = 50,
  label = "Attachments",
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const files = Array.from(e.target.files ?? []);
    const oversized = files.find((f) => f.size > maxMB * 1024 * 1024);
    if (oversized) { setError(`"${oversized.name}" exceeds ${maxMB} MB.`); e.target.value = ""; return; }
    if (value.length + files.length > maxFiles) { setError(`Maximum ${maxFiles} files.`); e.target.value = ""; return; }
    onChange([...value, ...files.map((file) => ({ url: URL.createObjectURL(file), file, mime: file.type }))]);
    e.target.value = "";
  }

  function remove(i: number) {
    URL.revokeObjectURL(value[i].url);
    onChange(value.filter((_, j) => j !== i));
  }

  return (
    <div>
      <span className="block text-sm font-medium text-slate-700">
        {label} <span className="font-normal text-slate-400">(max {maxFiles}, {maxMB} MB each)</span>
      </span>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {value.map(({ url, file, mime }, i) => {
          const isVideo = mime.startsWith("video/");
          const isPdf = mime === "application/pdf";
          return (
            <div key={url} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {isVideo ? (
                <>
                  <video src={url} className="h-full w-full object-cover" muted />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Film size={18} className="text-white" />
                  </div>
                </>
              ) : isPdf ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-1">
                  <FileText size={22} className="text-slate-400" />
                  <span className="text-[9px] text-slate-400 text-center leading-tight line-clamp-2">{file.name}</span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="h-full w-full object-cover" />
              )}
              <button type="button" onClick={() => remove(i)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80">
                <X size={11} />
              </button>
            </div>
          );
        })}
        {value.length < maxFiles && (
          <button type="button" onClick={() => ref.current?.click()}
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-xl text-slate-300 hover:border-slate-300 hover:text-slate-400 transition-colors">
            +
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept={accept} multiple className="hidden" onChange={onFileChange} />
    </div>
  );
}
