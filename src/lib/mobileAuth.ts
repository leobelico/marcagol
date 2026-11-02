// src/lib/mobileAuth.ts
//
// Helpers para el JWT de la app móvil.
// - verifyMobileAuth: para los endpoints de app/api/public/admin/...
// - getMobileSession: lo usa auth() (src/lib/auth.ts) para que las rutas
//   /api/admin de la web también acepten "Authorization: Bearer <token>".
// - isTenantAdmin / getTenantAdminAccess: permisos por torneo, leídos de
//   la base (no del token) para que un cambio de rol aplique de inmediato.
import jwt from "jsonwebtoken";
import type { Session } from "next-auth";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.MOBILE_JWT_SECRET!;

export interface MobileMembership {
  tenantId: string;
  tenantName: string;
  role: string;
  teamIds: string[];
}

export interface MobileAuthPayload {
  sub: string; // user id
  email: string | null;
  name: string | null;
  isSuperAdmin: boolean;
  memberships?: MobileMembership[];
}

export class UnauthorizedError extends Error {}

/**
 * Extrae y verifica el JWT del header Authorization: Bearer <token>.
 * Lanza UnauthorizedError si falta o es inválido — captúrala en el
 * route handler y responde 401.
 */
export function verifyMobileAuth(request: Request): MobileAuthPayload {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    throw new UnauthorizedError("No se proporcionó token");
  }

  try {
    return jwt.verify(token, JWT_SECRET) as MobileAuthPayload;
  } catch {
    throw new UnauthorizedError("Token inválido o expirado");
  }
}

/** ¿Puede este usuario administrar el torneo? (SUPER_ADMIN o ADMIN del tenant) */
export async function isTenantAdmin(
  auth: { sub: string; isSuperAdmin: boolean },
  tenantId: string
): Promise<boolean> {
  if (auth.isSuperAdmin) return true;
  const tenantUser = await prisma.tenantUser.findUnique({
    where: { userId_tenantId: { userId: auth.sub, tenantId } },
    select: { role: true },
  });
  return tenantUser?.role === "ADMIN";
}

/** IDs de los torneos que el usuario administra (null = todos, es SUPER_ADMIN) */
export async function adminTenantIds(auth: {
  sub: string;
  isSuperAdmin: boolean;
}): Promise<string[] | null> {
  if (auth.isSuperAdmin) return null;
  const rows = await prisma.tenantUser.findMany({
    where: { userId: auth.sub, role: "ADMIN" },
    select: { tenantId: true },
  });
  return rows.map((r) => r.tenantId);
}

/**
 * Construye una sesión con la misma forma que la de NextAuth a partir
 * del token de la app. Los datos se leen frescos de la base.
 */
export async function getMobileSession(token: string): Promise<Session | null> {
  let payload: MobileAuthPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as MobileAuthPayload;
  } catch {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: {
      tenants: {
        include: {
          tenant: { include: { organization: true } },
          teams: true,
        },
      },
    },
  });
  if (!user) return null;

  const memberships = user.tenants.map((tu) => ({
    tenantId: tu.tenantId,
    tenantName: tu.tenant.name,
    organizationId: tu.tenant.organizationId,
    organizationName: tu.tenant.organization?.name ?? null,
    role: tu.role,
    teamIds: tu.teams.map((tc) => tc.teamId),
  }));

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isSuperAdmin: user.isSuperAdmin,
      memberships,
      organizationId: memberships[0]?.organizationId,
      organizationName: memberships[0]?.organizationName,
    },
    expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  } as Session;
}
