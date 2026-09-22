"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Maximize2, X } from "lucide-react";
import clsx from "clsx";

export function VideoPreview({ src, className }: { src: string; className?: string }) {
  const t = useTranslations("common.mediaPreview");
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label={t("expand")}
        className={clsx(
          "group relative block w-full overflow-hidden rounded-lg border border-border bg-black",
          className
        )}
      >
        <video src={src} className="aspect-video w-full" muted preload="metadata" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
          <Maximize2 className="h-6 w-6" />
        </span>
      </button>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setExpanded(false)}
        >
          <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label={t("close")}
              className="absolute -top-10 right-0 rounded p-1 text-white hover:text-accent-2"
            >
              <X className="h-6 w-6" />
            </button>
            <video src={src} className="w-full rounded-lg" controls autoPlay />
          </div>
        </div>
      )}
    </>
  );
}
