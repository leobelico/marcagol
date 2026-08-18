import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const body = await req.json();

  const {
    name,
    slug,
    startDate,
    matchesPerDay,
    matchDuration,
    roundTrip,
    matchDays,
  } = body;

  if (!name || !slug) {
    return NextResponse.json(
      { error: "Nombre y slug son requeridos" },
      { status: 400 }
    );
  }

  const existing = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Ese subdominio ya está en uso" },
      { status: 400 }
    );
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: name as string,
      slug: slug as string,
      matchesPerDay: matchesPerDay as number,
      matchDuration: matchDuration as number,
      roundTrip: roundTrip as boolean,
      matchDays: matchDays as string[],
      ...(startDate && {
        startDate: new Date(startDate),
      }),
    },
  });

  return NextResponse.json(tenant);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const body = await req.json();

  const { id, archived } = body;

  if (!id) {
    return NextResponse.json(
      { error: "El id del torneo es requerido" },
      { status: 400 }
    );
  }

  if (typeof archived !== "boolean") {
    return NextResponse.json(
      { error: "El campo archived debe ser boolean" },
      { status: 400 }
    );
  }

  const tenant = await prisma.tenant.update({
    where: {
      id,
    },
    data: {
      archived,
    },
  });

  return NextResponse.json(tenant);
}