import { NextRequest, NextResponse } from "next/server";
import { requireTenantAdmin } from "@/lib/permissions";
import { notificarCalendario } from "@/lib/notificaciones";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireTenantAdmin(id);
  if ("error" in guard) return guard.error;
  const { tipo } = await req.json();

  if (tipo === "calendario") {
    const resultados = await notificarCalendario(id);
    return NextResponse.json({ ok: true, resultados });
  }

  return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
}