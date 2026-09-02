// app/api/public/admin/tenant/[slug]/equipos/route.ts
//
// GET: lista equipos del torneo.
// POST: crea un equipo NUEVO, replicando exactamente la lógica de
// app/api/admin/torneos/[id]/equipos (web):
//   - Flujo A: capitanUserId presente -> reutiliza un User existente,
//     asegura su TenantUser (rol CAPTAIN) y crea el TeamCaptain.
//   - Flujo B: sin capitanUserId -> crea un User nuevo (email generado
//     @marcagol.site, password = nombre + últimos 3 dígitos del tel),
//     su TenantUser y el TeamCaptain. Devuelve las credenciales para
//     que el admin se las dé al capitán.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileAuth, UnauthorizedError } from "@/lib/mobileAuth";
import bcrypt from "bcryptjs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = verifyMobileAuth(request);
    const { slug } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Torneo no encontrado" },
        { status: 404 }
      );
    }

    if (!auth.isSuperAdmin && auth.tenantId !== tenant.id) {
      return NextResponse.json(
        { error: "No tienes permiso sobre este torneo" },
        { status: 403 }
      );
    }

    const teams = await prisma.team.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        name: true,
        logo: true,
        captain: true,
        phone: true,
        _count: { select: { players: true } },
      },
      orderBy: { name: "asc" },
    });

    const result = teams.map((t) => ({
      id: t.id,
      name: t.name,
      logo: t.logo,
      captain: t.captain,
      phone: t.phone,
      playerCount: t._count.players,
    }));

    return NextResponse.json({ tenant, teams: result });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error fetching equipos admin:", error);
    return NextResponse.json(
      { error: "Error al obtener equipos" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = verifyMobileAuth(request);
    const { slug } = await params;
    const body = await request.json();

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json(
        { error: "Torneo no encontrado" },
        { status: 404 }
      );
    }
    if (!auth.isSuperAdmin && auth.tenantId !== tenant.id) {
      return NextResponse.json(
        { error: "No tienes permiso sobre este torneo" },
        { status: 403 }
      );
    }

    const tenantId = tenant.id;
    const { name, captain, phone } = body ?? {};
    const capitanUserId: string | null =
      typeof body?.capitanUserId === "string" && body.capitanUserId
        ? body.capitanUserId
        : null;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "El nombre del equipo es obligatorio" },
        { status: 400 }
      );
    }

    if (!capitanUserId) {
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
    }

    const nombreEquipo = name.trim();

    // ---- FLUJO A: reutilizar capitán existente ----
    if (capitanUserId) {
      const usuarioExistente = await prisma.user.findUnique({
        where: { id: capitanUserId },
      });
      if (!usuarioExistente) {
        return NextResponse.json(
          { error: "El capitán seleccionado no existe" },
          { status: 404 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        const team = await tx.team.create({
          data: {
            name: nombreEquipo,
            captain: usuarioExistente.name,
            phone: usuarioExistente.phone,
            tenantId,
          },
        });

        let tenantUser = await tx.tenantUser.findUnique({
          where: {
            userId_tenantId: { userId: usuarioExistente.id, tenantId },
          },
        });
        if (!tenantUser) {
          tenantUser = await tx.tenantUser.create({
            data: { userId: usuarioExistente.id, tenantId, role: "CAPTAIN" },
          });
        }

        await tx.teamCaptain.create({
          data: { tenantUserId: tenantUser.id, teamId: team.id },
        });

        return team;
      });

      return NextResponse.json({
        team: {
          id: result.id,
          name: result.name,
          logo: result.logo,
          captain: result.captain,
          phone: result.phone,
          playerCount: 0,
        },
      });
    }

    // ---- FLUJO B: crear capitán nuevo ----
    const nombreCapitan = captain.trim();
    const telefono = phone.trim();

    const emailBase = nombreCapitan
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, ".")
      .replace(/[^a-z0-9.]/g, "");
    const email = `${emailBase}@marcagol.site`;

    const usuarioExistente = await prisma.user.findUnique({
      where: { phone: telefono },
    });
    if (usuarioExistente) {
      return NextResponse.json(
        {
          error:
            "Ese teléfono ya está registrado. Búscalo en 'Capitán existente' para reutilizar su cuenta.",
        },
        { status: 400 }
      );
    }

    const usuarioEmailExistente = await prisma.user.findUnique({
      where: { email },
    });
    if (usuarioEmailExistente) {
      return NextResponse.json(
        { error: "Ese capitán ya tiene un usuario registrado" },
        { status: 400 }
      );
    }

    const ultimos3 = telefono.replace(/\D/g, "").slice(-3);
    const passwordInicial = `${nombreCapitan}${ultimos3}`;
    const passwordHash = await bcrypt.hash(passwordInicial, 10);

    const result = await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name: nombreEquipo,
          captain: nombreCapitan,
          phone: telefono,
          tenantId,
        },
      });

      const user = await tx.user.create({
        data: {
          name: nombreCapitan,
          email,
          phone: telefono,
          password: passwordHash,
          isSuperAdmin: false,
        },
      });

      const tenantUser = await tx.tenantUser.create({
        data: { userId: user.id, tenantId, role: "CAPTAIN" },
      });

      await tx.teamCaptain.create({
        data: { tenantUserId: tenantUser.id, teamId: team.id },
      });

      return { team, user };
    });

    return NextResponse.json({
      team: {
        id: result.team.id,
        name: result.team.name,
        logo: result.team.logo,
        captain: result.team.captain,
        phone: result.team.phone,
        playerCount: 0,
      },
      captainCredentials: {
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        password: passwordInicial,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error creando equipo:", error);
    return NextResponse.json(
      { error: "Error al crear equipo" },
      { status: 500 }
    );
  }
}