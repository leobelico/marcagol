// src/lib/suspensiones.ts
//
// Suspensiones por tarjeta roja. Cada roja guarda cuántos partidos de
// castigo lleva (MatchEvent.suspensionGames). Con eso se calcula
// Player.suspendedUntil = número de la última jornada que el jugador
// no puede jugar.
//
// Los partidos de castigo se cuentan sobre los partidos de SU EQUIPO
// después de la jornada de la roja (si el equipo descansa una jornada,
// esa no cuenta). Si el calendario todavía no tiene suficientes partidos
// de ese equipo, las jornadas que faltan se cuentan de una en una.
//
// Se recalcula al registrar o borrar una roja y cada vez que cambia el
// calendario (generar, mover, agregar o borrar partidos, liguilla).
import { prisma } from "./prisma";

/** Jornada hasta la que se suspende por una roja en la jornada `jornada`. */
function calcularHasta(jornada: number, partidos: number, jornadasDelEquipo: number[]) {
  const siguientes = jornadasDelEquipo.filter((n) => n > jornada);
  if (siguientes.length >= partidos) return siguientes[partidos - 1];
  const ultima = siguientes.length ? siguientes[siguientes.length - 1] : jornada;
  return ultima + (partidos - siguientes.length);
}

/** Recalcula la suspensión de un jugador (por Player.id) con todas sus rojas. */
export async function recalcularSuspension(playerId: string) {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { id: true, teamId: true },
  });
  if (!player) return;

  const rojas = await prisma.matchEvent.findMany({
    where: {
      type: "RED_CARD",
      suspensionGames: { gt: 0 },
      player: { playerId },
    },
    select: {
      suspensionGames: true,
      match: { select: { round: { select: { number: true } } } },
    },
  });

  let suspendedUntil: number | null = null;

  if (rojas.length > 0) {
    const partidosEquipo = await prisma.match.findMany({
      where: {
        OR: [{ homeTeamId: player.teamId }, { awayTeamId: player.teamId }],
        status: { not: "CANCELLED" },
        roundId: { not: null },
      },
      select: { round: { select: { number: true } } },
    });
    const jornadasDelEquipo = [
      ...new Set(partidosEquipo.map((m) => m.round!.number)),
    ].sort((a, b) => a - b);

    for (const roja of rojas) {
      const jornada = roja.match.round?.number;
      if (jornada == null || !roja.suspensionGames) continue;
      const hasta = calcularHasta(jornada, roja.suspensionGames, jornadasDelEquipo);
      if (suspendedUntil === null || hasta > suspendedUntil) suspendedUntil = hasta;
    }
  }

  await prisma.player.update({
    where: { id: playerId },
    data: { suspendedUntil },
  });
}

/** Recalcula a todos los jugadores del torneo que tienen rojas o suspensión. */
export async function recalcularSuspensionesTorneo(tenantId: string) {
  const jugadores = await prisma.player.findMany({
    where: {
      team: { tenantId },
      OR: [
        { suspendedUntil: { not: null } },
        { stats: { some: { events: { some: { type: "RED_CARD" } } } } },
      ],
    },
    select: { id: true },
  });
  for (const j of jugadores) {
    await recalcularSuspension(j.id);
  }
}

/**
 * Jornada "actual" del torneo: la primera jornada con partidos sin
 * terminar. Un jugador está suspendido si suspendedUntil >= esa jornada.
 * Devuelve null si ya no quedan partidos por jugar.
 */
export async function jornadaActual(tenantId: string) {
  const siguiente = await prisma.round.findFirst({
    where: {
      tenantId,
      matches: { some: { status: { in: ["SCHEDULED", "LIVE"] } } },
    },
    orderBy: { number: "asc" },
    select: { number: true },
  });
  return siguiente?.number ?? null;
}
