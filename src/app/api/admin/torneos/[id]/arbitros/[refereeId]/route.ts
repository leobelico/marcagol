import { NextRequest, NextResponse } from "next/server";
import { requireTenantAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; refereeId: string }> }) {
  const { id, refereeId } = await params;
  const guard = await requireTenantAdmin(id);
  if ("error" in guard) return guard.error;

  const referee = await prisma.referee.findFirst({ where: { id: refereeId, tenantId: id } });
  if (!referee) return NextResponse.json({ error: "Árbitro no encontrado" }, { status: 404 });

  // Quitar árbitro de todos sus partidos
  await prisma.match.updateMany({
    where: { refereeId },
    data: { refereeId: null },
  });

  await prisma.referee.delete({ where: { id: refereeId } });

  return NextResponse.json({ ok: true });
}