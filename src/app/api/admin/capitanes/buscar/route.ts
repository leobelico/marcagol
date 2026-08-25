import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ======================================================
// GET - BUSCAR CAPITANES EXISTENTES (nombre o teléfono)
// ======================================================

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const isSuperAdmin = (session.user as any).isSuperAdmin;
  const role = (session.user as any).role;

  if (!isSuperAdmin && role !== "ADMIN") {
    return NextResponse.json(
      { error: "No tienes permisos para buscar capitanes" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) {
    return NextResponse.json({ capitanes: [] });
  }

  // --------------------------------------------------
  // BUSCAR USUARIOS QUE SEAN CAPITÁN EN AL MENOS UN
  // TORNEO (tienen algún TeamCaptain), filtrando por
  // nombre o teléfono
  // --------------------------------------------------

  const usuarios = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ],
      tenants: {
        some: {
          teams: {
            some: {},
          },
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
          tenant: {
            select: {
              name: true,
            },
          },
          teams: {
            select: {
              team: {
                select: {
                  id: true,
                  name: true,
                },
              },
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
}