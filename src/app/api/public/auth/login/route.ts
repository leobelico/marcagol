// app/api/public/auth/login/route.ts
//
// Login para la APP MÓVIL únicamente. La web sigue usando NextAuth
// (src/lib/auth.ts) tal cual, sin tocarlo — este endpoint es paralelo
// y reutiliza la misma verificación (bcrypt contra User.password),
// pero devuelve un JWT propio en el body en vez de una cookie de sesión,
// porque la app no tiene contexto de cookies de navegador.
//
// Requiere instalar: npm install jsonwebtoken
// Requiere variable de entorno: MOBILE_JWT_SECRET (genera una cadena
// larga y aleatoria, distinta de la que usa NextAuth internamente)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.MOBILE_JWT_SECRET!;
const TOKEN_EXPIRY = "30d"; // la app no re-loguea seguido; ajusta si quieres

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body?.identifier ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Falta email/teléfono o contraseña" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
      include: { tenants: true },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const tenantUser = user.tenants[0];

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      isSuperAdmin: user.isSuperAdmin,
      role: tenantUser?.role ?? null,
      teamId: tenantUser?.teamId ?? null,
      tenantId: tenantUser?.tenantId ?? null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        role: tenantUser?.role ?? null,
      },
    });
  } catch (error) {
    console.error("Error en login móvil:", error);
    return NextResponse.json(
      { error: "Error al iniciar sesión" },
      { status: 500 }
    );
  }
}