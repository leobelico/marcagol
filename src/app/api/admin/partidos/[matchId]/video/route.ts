// Tlachtli TV: guarda (o borra, con vacío) el link de video de un partido.
import { NextRequest, NextResponse } from "next/server";
import { requireMatchAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { linkVideoValido } from "@/lib/video";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const guard = await requireMatchAdmin(matchId);
  if ("error" in guard) return guard.error;

  const body = await req.json().catch(() => null);
  const link = linkVideoValido(body?.videoUrl);
  if (!link.ok) {
    return NextResponse.json({ error: "Pega un link que empiece con https://" }, { status: 400 });
  }

  const match = await prisma.match.update({
    where: { id: matchId },
    data: { videoUrl: link.valor },
    select: { id: true, videoUrl: true },
  });
  return NextResponse.json(match);
}
