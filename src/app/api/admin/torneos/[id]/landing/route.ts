import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
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