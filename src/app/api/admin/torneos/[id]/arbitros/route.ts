import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { name, phone, email, payPerMatch, notes } = await req.json();

  const referee = await prisma.referee.create({
    data: {
      name,
      phone: phone || null,
      email: email || null,
      payPerMatch: payPerMatch || 0,
      notes: notes || null,
      tenantId: id,
    },
  });

  return NextResponse.json(referee);
}