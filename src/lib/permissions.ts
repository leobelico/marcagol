// src/lib/permissions.ts
//
// Guard para las rutas /api/admin: verifica que el usuario (web o app)
// sea SUPER_ADMIN o ADMIN del torneo indicado.
//
// Uso:
//   const guard = await requireTenantAdmin(tenantId);
//   if ("error" in guard) return guard.error;
//   const { session } = guard;
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { isTenantAdmin } from "./mobileAuth";

type Guard = { session: Session } | { error: NextResponse };

export async function requireTenantAdmin(
  tenantId: string | null | undefined
): Promise<Guard> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }

  const isSuperAdmin = !!(session.user as any).isSuperAdmin;
  if (!tenantId || !(await isTenantAdmin({ sub: session.user.id, isSuperAdmin }, tenantId))) {
    return {
      error: NextResponse.json(
        { error: "No tienes permiso sobre este torneo" },
        { status: 403 }
      ),
    };
  }

  return { session };
}

/** Igual que requireTenantAdmin, pero a partir del partido. */
export async function requireMatchAdmin(matchId: string): Promise<Guard> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { tenantId: true },
  });
  if (!match) {
    return { error: NextResponse.json({ error: "Partido no encontrado" }, { status: 404 }) };
  }
  return requireTenantAdmin(match.tenantId);
}
