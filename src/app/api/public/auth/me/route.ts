// app/api/public/auth/me/route.ts
//
// La app llama esto al arrancar (si ya tiene un token guardado) para
// confirmar que sigue siendo válido y refrescar los datos del usuario,
// sin pedirle que vuelva a loguearse cada vez.
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.MOBILE_JWT_SECRET!;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "No se proporcionó token" },
        { status: 401 }
      );
    }

    const payload = jwt.verify(token, JWT_SECRET) as {
      sub: string;
      email: string | null;
      name: string | null;
      isSuperAdmin: boolean;
      role: string | null;
    };

    return NextResponse.json({
      user: {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        isSuperAdmin: payload.isSuperAdmin,
        role: payload.role,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Token inválido o expirado" },
      { status: 401 }
    );
  }
}