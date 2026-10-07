"use client";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className ?? "rounded-lg border border-border px-3 py-1.5 text-sm text-foreground"}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.assign("/login");
      }}
    >
      Abmelden
    </button>
  );
}
