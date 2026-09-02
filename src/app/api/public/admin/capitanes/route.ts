// app/api/public/admin/capitanes/route.ts
//
// Busca capitanes existentes por nombre o teléfono, para reasignar
// a un equipo. Mismo criterio que /api/admin/capitanes/buscar de la
// web, adaptado a auth móvil (JWT en vez de sesión NextAuth).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileAuth, UnauthorizedError } from "@/lib/mobileAuth";

export async function GET(request: Request) {
  try {
    const auth = verifyMobileAuth(request);

    if (!auth.isSuperAdmin && auth.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para buscar capitanes" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) {
      return NextResponse.json({ capitanes: [] });
    }

    const usuarios = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
        tenants: {
          some: {
            teams: { some: {} },
          },
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        tenants: {
          select: {
            tenantId: true,
            tenant: { select: { name: true } },
            teams: {
              select: {
                team: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      take: 15,
    });

    const capitanes = usuarios.map((u) => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      email: u.email,
      equipos: u.tenants.flatMap((tu) =>
        tu.teams.map((tc) => ({
          teamId: tc.team.id,
          teamName: tc.team.name,
          tenantName: tu.tenant.name,
        }))
      ),
    }));

    return NextResponse.json({ capitanes });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error buscando capitanes:", error);
    return NextResponse.json(
      { error: "Error al buscar capitanes" },
      { status: 500 }
    );
  }
}