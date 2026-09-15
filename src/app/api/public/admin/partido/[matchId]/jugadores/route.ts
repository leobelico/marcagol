// app/api/public/admin/partido/[matchId]/jugadores/route.ts
//
// Lista los jugadores de ambos equipos de un partido, para que el
// admin elija a quién asignar un gol/asistencia/tarjeta al capturar
// el resultado.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileAuth, UnauthorizedError } from "@/lib/mobileAuth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const auth = verifyMobileAuth(request);
    const { matchId } = await params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        tenantId: true,
        homeTeam: {
          select: {
            id: true,
            name: true,
            players: { select: { id: true, name: true, number: true } },
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            players: { select: { id: true, name: true, number: true } },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Partido no encontrado" },
        { status: 404 }
      );
    }
    if (!auth.isSuperAdmin && auth.tenantId !== match.tenantId) {
      return NextResponse.json(
        { error: "No tienes permiso sobre este partido" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error fetching jugadores del partido:", error);
    return NextResponse.json(
      { error: "Error al obtener jugadores" },
      { status: 500 }
    );
  }
}