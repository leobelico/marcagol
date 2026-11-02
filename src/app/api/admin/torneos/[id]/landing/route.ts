import { NextRequest, NextResponse } from "next/server";
import { requireTenantAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireTenantAdmin(id);
  if ("error" in guard) return guard.error;
  const body = await req.json();

  const torneo = await prisma.tenant.update({
    where: { id },
    data: {
      description: body.description || null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      maxTeams: body.maxTeams ?? null,
      inscriptionFee: body.inscriptionFee ?? null,
      contactName: body.contactName || null,
      contactPhone: body.contactPhone || null,
      contactEmail: body.contactEmail || null,
      instagram: body.instagram || null,
      facebook: body.facebook || null,
      whatsapp: body.whatsapp || null,
      bannerUrl: body.bannerUrl || null,
      published: body.published,
    },
  });

  return NextResponse.json(torneo);
}