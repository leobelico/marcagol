import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/permissions";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  const { id, teamId } = await params;
  const guard = await requireTenantAdmin(id);
  if ("error" in guard) return guard.error;

  const { allowLateRegistration } = await req.json();

  const team = await prisma.team.update({
    where: {
      id: teamId,
      tenantId: id,
    },
    data: {
      allowLateRegistration: !!allowLateRegistration,
    },
  });

  return NextResponse.json({
    allowLateRegistration: team.allowLateRegistration,
  });
}