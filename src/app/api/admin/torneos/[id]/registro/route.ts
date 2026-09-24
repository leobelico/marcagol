import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const { registrationOpen } = await req.json();

  const tenant = await prisma.tenant.update({
    where: { id: params.tenantId },
    data: { registrationOpen: !!registrationOpen },
  });

  return NextResponse.json({ registrationOpen: tenant.registrationOpen });
}