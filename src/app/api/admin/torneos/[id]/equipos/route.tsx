import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const { name, captain, phone } = await req.json();

const email = `${captain
  .trim()
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/\s+/g, ".")
  .replace(/[^a-z0-9.]/g, "")}@marcagol.site`;

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "El nombre del equipo es obligatorio" },
      { status: 400 }
    );
  }

  if (!captain?.trim()) {
    return NextResponse.json(
      { error: "El nombre del capitán es obligatorio" },
      { status: 400 }
    );
  }

  if (!phone?.trim()) {
    return NextResponse.json(
      { error: "El teléfono del capitán es obligatorio" },
      { status: 400 }
    );
  }

  // Limpiamos el teléfono
  const telefono = phone.trim();

  // Verificar que el teléfono no esté registrado
  const usuarioExistente = await prisma.user.findUnique({
    where: {
      phone: telefono,
    },
  });

  if (usuarioExistente) {
    return NextResponse.json(
      { error: "Ese teléfono ya está registrado" },
      { status: 400 }
    );
  }

  // Últimos 3 dígitos del teléfono
  const ultimos3 = telefono.replace(/\D/g, "").slice(-3);

  // Contraseña inicial:
  // Ejemplo: Juan Pérez + 567
  const passwordInicial = `${captain.trim()}${ultimos3}`;

  const passwordHash = await bcrypt.hash(passwordInicial, 10);

  // Todo se crea junto
  const result = await prisma.$transaction(async (tx) => {
    // 1. Crear equipo
    const team = await tx.team.create({
      data: {
        name: name.trim(),
        captain: captain.trim(),
        phone: telefono,
        tenantId: id,
      },
    });

    // 2. Crear usuario del capitán
const user = await tx.user.create({
  data: {
    name: captain.trim(),
    email,
    phone: telefono,
    password: passwordHash,
    isSuperAdmin: false,
  },
});

    // 3. Relacionarlo con el torneo y el equipo
    const tenantUser = await tx.tenantUser.create({
      data: {
        userId: user.id,
        tenantId: id,
        teamId: team.id,
        role: "CAPTAIN",
      },
    });

    return {
      team,
      user,
      tenantUser,
      passwordInicial,
    };
  });

  return NextResponse.json({
    team: result.team,

    // Solo para que el administrador pueda
    // conocer las credenciales iniciales.
    captainCredentials: {
      name: result.user.name,
      phone: result.user.phone,
      password: result.passwordInicial,
    },
  });
}