// app/api/public/admin/partido/[matchId]/video/route.ts
//
// Tlachtli TV desde la app: el admin guarda (o borra, con vacío) el link
// de YouTube del partido, en vivo o grabado.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileAuth, UnauthorizedError, isTenantAdmin } from "@/lib/mobileAuth";
import { linkVideoValido } from "@/lib/video";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const auth = verifyMobileAuth(request);
    const { matchId } = await params;
    const body = await request.json().catch(() => null);

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, tenantId: true },
    });
    if (!match) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
    }
    if (!(await isTenantAdmin(auth, match.tenantId))) {
      return NextResponse.json({ error: "No tienes permiso sobre este partido" }, { status: 403 });
    }

    const link = linkVideoValido(body?.videoUrl);
    if (!link.ok) {
      return NextResponse.json({ error: "Pega un link que empiece con https://" }, { status: 400 });
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { videoUrl: link.valor },
      select: { id: true, videoUrl: true },
    });
    return NextResponse.json({ match: updated });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error guardando video:", error);
    return NextResponse.json({ error: "Error al guardar el video" }, { status: 500 });
  }
}
