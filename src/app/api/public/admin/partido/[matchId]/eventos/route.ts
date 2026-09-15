// app/api/public/admin/partido/[matchId]/eventos/route.ts
//
// GET: lista los eventos ya capturados de este partido.
// POST: crea un evento (GOAL/YELLOW_CARD/RED_CARD) para un jugador,
// y actualiza su PlayerStat acumulado en la misma transacción —
// para que la tabla de goleo (que lee PlayerStat) siga cuadrando
// con los eventos por partido.
//
// Nota: "asistencia" no es un EventType en el schema (los tipos son
// GOAL/YELLOW_CARD/RED_CARD/SUBSTITUTION). Para no inventar un valor
// de enum que no existe en la base de datos real, las asistencias se
// registran SOLO como incremento de PlayerStat.assists, sin crear un
// MatchEvent — igual se reflejan en el perfil del jugador vía el
// acumulado, aunque no aparezcan ancladas a un partido específico
// con minuto exacto como los goles/tarjetas.
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
      select: { id: true, tenantId: true },
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

    const events = await prisma.matchEvent.findMany({
      where: { matchId },
      include: {
        player: { include: { player: { select: { id: true, name: true, teamId: true } } } },
      },
      orderBy: { minute: "asc" },
    });

    const result = events.map((e) => ({
      id: e.id,
      type: e.type,
      minute: e.minute,
      player: { id: e.player.player.id, name: e.player.player.name },
    }));

    return NextResponse.json({ events: result });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error fetching eventos:", error);
    return NextResponse.json(
      { error: "Error al obtener eventos" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const auth = verifyMobileAuth(request);
    const { matchId } = await params;
    const body = await request.json();

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, tenantId: true },
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

    const playerId = String(body?.playerId ?? "");
    const type = String(body?.type ?? ""); // "GOAL" | "YELLOW_CARD" | "RED_CARD" | "ASSIST"
    const minute = Number(body?.minute ?? 0);

    if (!playerId) {
      return NextResponse.json(
        { error: "Falta el jugador" },
        { status: 400 }
      );
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true },
    });
    if (!player) {
      return NextResponse.json(
        { error: "Jugador no encontrado" },
        { status: 404 }
      );
    }

    // Asegura que el jugador tenga su fila de PlayerStat (igual que
    // el resto de la app asume — algunos jugadores viejos podrían no
    // tenerla si se crearon antes de que existiera este flujo).
    let stat = await prisma.playerStat.findUnique({ where: { playerId } });
    if (!stat) {
      stat = await prisma.playerStat.create({ data: { playerId } });
    }

    if (type === "ASSIST") {
      // Las asistencias no son un EventType del schema: solo se
      // incrementa el acumulado, sin MatchEvent (ver nota arriba).
      const updatedStat = await prisma.playerStat.update({
        where: { playerId },
        data: { assists: { increment: 1 } },
      });
      return NextResponse.json({ stat: updatedStat });
    }

    const validTypes = ["GOAL", "YELLOW_CARD", "RED_CARD"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Tipo de evento inválido" },
        { status: 400 }
      );
    }

    const [event, updatedStat] = await prisma.$transaction([
      prisma.matchEvent.create({
        data: {
          type: type as "GOAL" | "YELLOW_CARD" | "RED_CARD",
          minute: Number.isFinite(minute) ? minute : 0,
          matchId,
          playerId: stat.id, // MatchEvent.playerId apunta a PlayerStat.id
        },
      }),
      prisma.playerStat.update({
        where: { playerId },
        data:
          type === "GOAL"
            ? { goals: { increment: 1 } }
            : type === "YELLOW_CARD"
            ? { yellow: { increment: 1 } }
            : { red: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ event, stat: updatedStat });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error creando evento:", error);
    return NextResponse.json(
      { error: "Error al registrar el evento" },
      { status: 500 }
    );
  }
}