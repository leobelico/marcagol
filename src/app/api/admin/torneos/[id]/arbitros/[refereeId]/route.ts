import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ refereeId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { refereeId } = await params;

  // Quitar árbitro de todos sus partidos
  await prisma.match.updateMany({
    where: { refereeId },
    data: { refereeId: null },
  });

  await prisma.referee.delete({ where: { id: refereeId } });

  return NextResponse.json({ ok: true });
}