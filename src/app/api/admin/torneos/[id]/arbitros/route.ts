import { NextRequest, NextResponse } from "next/server";
import { requireTenantAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// Lista de árbitros con sus partidos (lo que la web carga en
// /admin/torneos/[id]/arbitros). Lo usa la app móvil.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireTenantAdmin(id);
  if ("error" in guard) return guard.error;

  const referees = await prisma.referee.findMany({
    where: { tenantId: id },
    include: {
      matches: {
        select: {
          id: true,
          date: true,
          status: true,
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ referees });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireTenantAdmin(id);
  if ("error" in guard) return guard.error;
  const { name, phone, email, payPerMatch, notes } = await req.json();

  const referee = await prisma.referee.create({
    data: {
      name,
      phone: phone || null,
      email: email || null,
      payPerMatch: payPerMatch || 0,
      notes: notes || null,
      tenantId: id,
    },
  });

  return NextResponse.json(referee);
}