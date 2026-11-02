import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/permissions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireTenantAdmin(id);
  if ("error" in guard) return guard.error;

  const encuestas = await prisma.encuestaArbitral.findMany({
    where: { match: { round: { tenantId: id } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ encuestas });
}