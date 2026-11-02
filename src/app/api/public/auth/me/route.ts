// app/api/public/auth/me/route.ts
//
// La app llama esto al arrancar (si ya tiene un token guardado) para
// confirmar que sigue siendo válido y refrescar los datos del usuario,
// sin pedirle que vuelva a loguearse cada vez. Los datos (incluyendo
// memberships) se leen frescos de la base, no del token.
import { NextResponse } from "next/server";
import { getMobileSession } from "@/lib/mobileAuth";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json(
      { error: "No se proporcionó token" },
      { status: 401 }
    );
  }

  const session = await getMobileSession(token);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Token inválido o expirado" },
      { status: 401 }
    );
  }

  const user = session.user as any;
  const memberships = user.memberships as { role: string }[];

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      // Rol "principal" para la app: ADMIN si administra algún torneo,
      // CAPTAIN si solo es capitán.
      role: user.isSuperAdmin
        ? "SUPER_ADMIN"
        : memberships.some((m) => m.role === "ADMIN")
        ? "ADMIN"
        : memberships.some((m) => m.role === "CAPTAIN")
        ? "CAPTAIN"
        : null,
      memberships,
    },
  });
}
