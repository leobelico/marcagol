import { NextRequest, NextResponse } from "next/server";
import { requireTenantAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; financeId: string }> }) {
  const { id, financeId } = await params;
  const guard = await requireTenantAdmin(id);
  if ("error" in guard) return guard.error;

  const { count } = await prisma.finance.deleteMany({ where: { id: financeId, tenantId: id } });
  if (count === 0) return NextResponse.json({ error: "Movimiento no encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}