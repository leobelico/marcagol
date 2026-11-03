// Publica la jornada revisada: por cada liga crea la siguiente jornada
// con sus partidos (fecha + hora + cancha).
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cargarArmado, requireOrgAdmin } from "@/lib/armadoRolServer";
import { revisarPropuesta, type PartidoArmado } from "@/lib/armadoRol";
import { recalcularSuspensionesTorneo } from "@/lib/suspensiones";
import { NUM_CANCHAS, fechaPartido, lunesDe } from "@/lib/rol";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const guard = await requireOrgAdmin(body.org);
  if ("error" in guard) return guard.error;

  const semana = typeof body.semana === "string" ? lunesDe(body.semana) : null;
  if (!semana) return NextResponse.json({ error: "Semana inválida" }, { status: 400 });

  const partidos: PartidoArmado[] = (Array.isArray(body.partidos) ? (body.partidos as PartidoArmado[]) : []).filter(
    (p) => p && typeof p.ligaId === "string" && typeof p.homeId === "string" && typeof p.awayId === "string"
  );
  if (partidos.length === 0) return NextResponse.json({ error: "No hay partidos para publicar" }, { status: 400 });

  const tenantIds = [...new Set(partidos.map((p) => p.ligaId))];
  if (tenantIds.some((id) => !guard.tenantIds.includes(id))) {
    return NextResponse.json({ error: "No tienes permiso sobre alguna de las ligas" }, { status: 403 });
  }

  // Revisar contra el estado actual de la base (alguien pudo publicar mientras tanto)
  const { ligas, ocupados } = await cargarArmado(tenantIds, semana);
  const equiposDe = new Map(ligas.map((l) => [l.id, new Set(l.equipos.map((e) => e.id))]));
  for (const p of partidos) {
    const eqs = equiposDe.get(p.ligaId);
    if (!eqs?.has(p.homeId) || !eqs.has(p.awayId)) {
      return NextResponse.json({ error: "Hay un partido con un equipo que no es de su liga" }, { status: 400 });
    }
    if (!p.dia || !p.hora || !p.cancha || p.cancha < 1 || p.cancha > NUM_CANCHAS) {
      return NextResponse.json({ error: "Todos los partidos necesitan día, hora y cancha" }, { status: 400 });
    }
  }

  const revision = revisarPropuesta(ligas, partidos, ocupados);
  if (revision.errores.length > 0) {
    return NextResponse.json({ error: revision.errores[0] }, { status: 400 });
  }
  const choque = Object.values(revision.avisos)
    .flat()
    .find((a) => a.startsWith("Choque") || a.startsWith("Esa cancha") || a.includes("contra sí mismo"));
  if (choque) return NextResponse.json({ error: choque }, { status: 400 });

  const creadas: { ligaId: string; jornada: number; partidos: number }[] = [];

  await prisma.$transaction(async (tx) => {
    for (const ligaId of tenantIds) {
      const ultima = await tx.round.findFirst({ where: { tenantId: ligaId }, orderBy: { number: "desc" } });
      const numero = (ultima?.number ?? 0) + 1;
      const round = await tx.round.create({
        data: { tenantId: ligaId, number: numero, name: `Jornada ${numero}` },
      });
      const deLiga = partidos.filter((p) => p.ligaId === ligaId);
      await tx.match.createMany({
        data: deLiga.map((p) => ({
          tenantId: ligaId,
          roundId: round.id,
          homeTeamId: p.homeId,
          awayTeamId: p.awayId,
          date: fechaPartido(semana, p.dia!, p.hora!),
          cancha: p.cancha,
          status: "SCHEDULED" as const,
        })),
      });
      creadas.push({ ligaId, jornada: numero, partidos: deLiga.length });
    }
  });

  for (const ligaId of tenantIds) await recalcularSuspensionesTorneo(ligaId);

  return NextResponse.json({ ok: true, creadas });
}
