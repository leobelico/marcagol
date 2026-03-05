import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { matchId } = await params;
  const body = await req.json();
  const { homeScore, awayScore, status } = body;

  const match = await prisma.match.update({
    where: { id: matchId },
    data: {
      ...(status && { status }),
      ...(homeScore !== undefined && { homeScore }),
      ...(awayScore !== undefined && { awayScore }),
    },
  });

  return NextResponse.json(match);
}