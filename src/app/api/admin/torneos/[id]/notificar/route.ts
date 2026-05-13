import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { notificarCalendario } from "@/lib/notificaciones";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { tipo } = await req.json();

  if (tipo === "calendario") {
    const resultados = await notificarCalendario(id);
    return NextResponse.json({ ok: true, resultados });
  }

  return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
}