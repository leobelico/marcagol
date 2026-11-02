import { NextRequest, NextResponse } from "next/server";
import { requireMatchAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const guard = await requireMatchAdmin(matchId);
  if ("error" in guard) return guard.error;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { include: { players: true } },
      awayTeam: { include: { players: true } },
    },
  });

  if (!match) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });

  return NextResponse.json({
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
  });
}