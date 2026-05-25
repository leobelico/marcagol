import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: tenantId } = await params;
  const { partidos } = await req.json();

  if (!partidos?.length) return NextResponse.json({ error: "Sin partidos" }, { status: 400 });

  // Obtener equipos y partidos existentes
  const equipos = await prisma.team.findMany({ where: { tenantId } });
  const nombreEquipo = (id: string) => equipos.find(e => e.id === id)?.name ?? id;

  const existingMatches = await prisma.match.findMany({
    where: { tenantId, status: { not: "CANCELLED" } },
    include: { homeTeam: true, awayTeam: true },
  });

  const errores: string[] = [];
  const creados: any[] = [];

  const jornadasMap = new Map<number, typeof partidos>();
  partidos.forEach((p: any) => {
    if (!jornadasMap.has(p.jornada)) jornadasMap.set(p.jornada, []);
    jornadasMap.get(p.jornada)!.push(p);
  });

  for (const [numJornada, partidosJornada] of jornadasMap.entries()) {
    let round = await prisma.round.findFirst({
      where: { tenantId, number: numJornada },
    });
    if (!round) {
      round = await prisma.round.create({
        data: { tenantId, number: numJornada, name: `Jornada ${numJornada}` },
      });
    }

    for (const p of partidosJornada) {
      const [anio, mes, dia] = String(p.fecha).split("-");
      const [hh, mm] = String(p.hora).split(":");
      const matchDate = new Date(Number(anio), Number(mes) - 1, Number(dia), Number(hh), Number(mm));
      const matchEnd = new Date(matchDate.getTime() + 90 * 60 * 1000);

      // 1. ¿Ya se enfrentaron?
      const yaJugaron = [...existingMatches, ...creados].find(m =>
        (m.homeTeamId === p.homeTeamId && m.awayTeamId === p.awayTeamId) ||
        (m.homeTeamId === p.awayTeamId && m.awayTeamId === p.homeTeamId)
      );
      if (yaJugaron) {
        errores.push(`${nombreEquipo(p.homeTeamId)} vs ${nombreEquipo(p.awayTeamId)}: ya se enfrentaron`);
        continue;
      }

      // 2. ¿Cancha ocupada?
      const canchaOcupada = [...existingMatches, ...creados].find(m => {
        if (m.cancha !== p.cancha) return false;
        const mStart = new Date(m.date);
        const mEnd = new Date(mStart.getTime() + 90 * 60 * 1000);
        return matchDate < mEnd && matchEnd > mStart;
      });
      if (canchaOcupada) {
        errores.push(`Cancha ${p.cancha} ocupada a las ${p.hora} — ${canchaOcupada.homeTeam?.name} vs ${canchaOcupada.awayTeam?.name}`);
        continue;
      }

      // 3. ¿Equipo ya juega en esa jornada?
      const equipoEnJornada = [...existingMatches, ...creados].find(m => {
        if (m.roundId !== round!.id) return false;
        return m.homeTeamId === p.homeTeamId || m.awayTeamId === p.homeTeamId ||
               m.homeTeamId === p.awayTeamId || m.awayTeamId === p.awayTeamId;
      });
      if (equipoEnJornada) {
        errores.push(`${nombreEquipo(p.homeTeamId)} o ${nombreEquipo(p.awayTeamId)} ya tiene partido en jornada ${numJornada}`);
        continue;
      }

      try {
        const match = await prisma.match.create({
          data: {
            tenantId,
            homeTeamId: p.homeTeamId,
            awayTeamId: p.awayTeamId,
            date: matchDate,
            cancha: p.cancha,
            roundId: round.id,
            status: "SCHEDULED",
          },
          include: { homeTeam: true, awayTeam: true },
        });
        creados.push(match);
      } catch (e: any) {
        errores.push(`Error al crear partido: ${e.message}`);
      }
    }
  }

  return NextResponse.json({ creados: creados.length, errores });
}