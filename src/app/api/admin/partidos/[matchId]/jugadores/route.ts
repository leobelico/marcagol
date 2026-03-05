import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { matchId } = await params;

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