import { NextRequest, NextResponse } from "next/server";
import { requireTenantAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// Movimientos + equipos del torneo (lo que la web carga en
// /admin/torneos/[id]/finanzas). Lo usa la app móvil.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireTenantAdmin(id);
  if ("error" in guard) return guard.error;

  const [finances, teams] = await Promise.all([
    prisma.finance.findMany({
      where: { tenantId: id },
      include: { team: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.team.findMany({
      where: { tenantId: id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({ finances, teams });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireTenantAdmin(id);
  if ("error" in guard) return guard.error;
  const { type, category, amount, description, teamId, date } = await req.json();

  const finance = await prisma.finance.create({
    data: {
      type,
      category,
      amount,
      description: description || null,
      teamId: teamId || null,
      date: new Date(date),
      tenantId: id,
    },
  });

  return NextResponse.json(finance);
}