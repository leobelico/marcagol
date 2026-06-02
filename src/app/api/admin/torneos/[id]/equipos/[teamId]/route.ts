import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; teamId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { teamId } = await params;

  await prisma.playerStat.deleteMany({ where: { player: { teamId } } });
  await prisma.player.deleteMany({ where: { teamId } });
  await prisma.team.delete({ where: { id: teamId } });

  return NextResponse.json({ ok: true });
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; teamId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { teamId } = await params;
  const { name } = await req.json();

  if (!name?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const team = await prisma.team.update({
    where: { id: teamId },
    data: { name: name.trim() },
  });

  return NextResponse.json({ ok: true, team });
}