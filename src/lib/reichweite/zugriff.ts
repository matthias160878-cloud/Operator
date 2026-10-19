import { NextResponse } from "next/server";
import { requireSessionUser, type SessionUser } from "@/lib/auth/session";

/** Lesen dürfen alle Rollen im Workspace, ändern nur Inhaber, Admins und Redaktion. */
export function darfBearbeiten(role: SessionUser["role"]): boolean {
  return role === "OWNER" || role === "ADMIN" || role === "EDITOR";
}

export async function bearbeiterOderAntwort(): Promise<SessionUser | Response> {
  const user = await requireSessionUser();
  if (!darfBearbeiten(user.role)) {
    return NextResponse.json({ error: "Für diese Aktion fehlen die Rechte (nur Lesen)." }, { status: 403 });
  }
  return user;
}
