// src/lib/mobileAuth.ts
//
// Helper para verificar el JWT de la app móvil en endpoints protegidos
// (los de app/api/public/admin/...). No confundir con src/lib/auth.ts
// (NextAuth), que sigue siendo exclusivo de la web.
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.MOBILE_JWT_SECRET!;

export interface MobileAuthPayload {
  sub: string; // user id
  email: string | null;
  name: string | null;
  isSuperAdmin: boolean;
  role: string | null;
  teamId: string | null;
  tenantId: string | null;
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