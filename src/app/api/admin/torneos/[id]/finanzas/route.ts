import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { type, category, amount, description, teamId, date } = await req.json();

  const finance = await prisma.finance.create({
    data: {
      type,
      category,
      amount,
      description: description || null,
      teamId: teamId || null,
      date: new Date(date),
      tenantId: id,
    },
  });

  return NextResponse.json(finance);
}