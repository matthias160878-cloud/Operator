import type { ReactNode } from "react";
import { LegalFooter } from "@/components/legal/LegalFooter";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-grid px-4 py-12">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <div className="mb-5 text-center">
          <div className="text-xs uppercase tracking-[0.25em] text-accent-2">SECRET 58</div>
          <h1 className="mt-2 text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {children}
        <LegalFooter className="mt-5 flex justify-center gap-4 text-xs text-muted" />
      </div>
    </div>
  );
}
