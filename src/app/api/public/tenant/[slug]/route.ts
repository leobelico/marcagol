// app/api/public/tenants/[slug]/route.ts
//
// [slug] aquí es el slug de la ORGANIZACIÓN (ej. "liga-rinos"),
// devuelve los torneos (Tenants) que pertenecen a esa organización.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const organization = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organización no encontrada" },
        { status: 404 }
      );
    }

    const tenants = await prisma.tenant.findMany({
      where: {
        organizationId: organization.id,
        archived: false,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        bannerUrl: true,
        startDate: true,
        endDate: true,
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({
      organization,
      tenants,
    });
  } catch (error) {
    console.error("Error fetching tenants for organization:", error);
    return NextResponse.json(
      { error: "Error al obtener torneos" },
      { status: 500 }
    );
  }
}