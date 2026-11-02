// Sub admins (ADMIN de un torneo). Misma lógica que las server actions
// de /admin/subadmins, expuesta como API para la app móvil.
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!(session.user as any).isSuperAdmin) {
    return NextResponse.json({ error: "Solo el super admin puede gestionar sub admins" }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const [subAdmins, torneos] = await Promise.all([
    prisma.tenantUser.findMany({
      where: { role: "ADMIN" },
      select: {
        user: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true } },
      },
      orderBy: { tenant: { name: "asc" } },
    }),
    prisma.tenant.findMany({
      where: { archived: false },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({ subAdmins, torneos });
}

export async function POST(req: NextRequest) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const { email, name, password, tenantId } = await req.json();
  if (!email || !name || !password || !tenantId) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });

  const hashed = await bcrypt.hash(password, 10);

  // Crear usuario si no existe (si ya existe se conserva su contraseña)
  const user = await prisma.user.upsert({
    where: { email: String(email).trim().toLowerCase() },
    update: {},
    create: {
      email: String(email).trim().toLowerCase(),
      name,
      password: hashed,
      isSuperAdmin: false,
    },
  });

  await prisma.tenantUser.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId } },
    update: { role: "ADMIN" },
    create: { userId: user.id, tenantId, role: "ADMIN" },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const { userId, tenantId } = await req.json();
  if (!userId || !tenantId) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  await prisma.tenantUser.deleteMany({ where: { userId, tenantId, role: "ADMIN" } });
  return NextResponse.json({ ok: true });
}
