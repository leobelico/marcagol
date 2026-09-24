import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { tenantId: string; teamId: string } }
) {
  const { allowLateRegistration } = await req.json();

  const team = await prisma.team.update({
    where: { id: params.teamId, tenantId: params.tenantId },
    data: { allowLateRegistration: !!allowLateRegistration },
  });

  return NextResponse.json({ allowLateRegistration: team.allowLateRegistration });
}