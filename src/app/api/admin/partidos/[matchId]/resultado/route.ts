import { NextRequest, NextResponse } from "next/server";
import { requireMatchAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const guard = await requireMatchAdmin(matchId);
  if ("error" in guard) return guard.error;
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