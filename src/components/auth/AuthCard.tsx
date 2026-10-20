import type { ReactNode } from "react";
import Image from "next/image";
import { LegalFooter } from "@/components/legal/LegalFooter";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-grid px-4 py-12">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <div className="mb-5 text-center">
          <Image
            src="/brand/logo-voll.png"
            alt="SECRET 58 — secret58.com"
            width={960}
            height={640}
            sizes="(max-width: 448px) 90vw, 360px"
            className="mx-auto mb-3 h-auto w-full max-w-[18rem] rounded-xl"
            priority
          />
          <div className="text-xs uppercase tracking-[0.25em] text-accent-2">SECRET 58</div>
          <h1 className="mt-2 text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {children}
        <LegalFooter installieren startseite className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted" />
      </div>
    </div>
  );
}
