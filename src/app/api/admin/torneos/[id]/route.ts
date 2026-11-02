import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/permissions";

// Resumen + configuración + datos de landing del torneo (lo que la web
// carga en /admin/torneos/[id] y /landing). Lo usa la app móvil.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireTenantAdmin(id);
  if ("error" in guard) return guard.error;

  const torneo = await prisma.tenant.findUnique({
    where: { id },
    include: { _count: { select: { teams: true, matches: true, rounds: true } } },
  });
  if (!torneo) return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });

  return NextResponse.json({ torneo });
}
