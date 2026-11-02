// Lista de capitanes con sus equipos (lo que la web carga en
// /admin/capitanes). Solo super admin. Lo usa la app móvil.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!(session.user as any).isSuperAdmin) {
    return NextResponse.json({ error: "No tienes permisos para esta acción" }, { status: 403 });
  }

  const usuarios = await prisma.user.findMany({
    where: { tenants: { some: { teams: { some: {} } } } },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      tenants: {
        select: {
          tenant: { select: { id: true, name: true } },
          teams: { select: { team: { select: { id: true, name: true } } } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const capitanes = usuarios.map((u) => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    equipos: u.tenants.flatMap((tu) =>
      tu.teams.map((t) => ({
        teamId: t.team.id,
        teamName: t.team.name,
        tenantName: tu.tenant.name,
      }))
    ),
  }));

  return NextResponse.json({ capitanes });
}
