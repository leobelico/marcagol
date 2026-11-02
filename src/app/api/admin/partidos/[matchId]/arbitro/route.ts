import { NextRequest, NextResponse } from "next/server";
import { requireMatchAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const guard = await requireMatchAdmin(matchId);
  if ("error" in guard) return guard.error;
  const { refereeId } = await req.json();

  if (refereeId) {
    const match = await prisma.match.findUnique({ where: { id: matchId }, select: { tenantId: true } });
    const referee = await prisma.referee.findFirst({ where: { id: refereeId, tenantId: match?.tenantId } });
    if (!referee) return NextResponse.json({ error: "Árbitro no encontrado" }, { status: 404 });
  }

  const match = await prisma.match.update({
    where: { id: matchId },
    data: { refereeId: refereeId || null },
  });

  return NextResponse.json(match);
}