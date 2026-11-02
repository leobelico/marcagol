import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/permissions";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireTenantAdmin(id);
  if ("error" in guard) return guard.error;

  const { registrationOpen } = await req.json();

  const tenant = await prisma.tenant.update({
    where: {
      id,
    },
    data: {
      registrationOpen: !!registrationOpen,
    },
  });

  return NextResponse.json({
    registrationOpen: tenant.registrationOpen,
  });
}