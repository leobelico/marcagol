import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// ⚠️ Agrega aquí la misma validación de sesión/admin que usas en tus otras rutas /api/admin

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const encuestas = await prisma.encuestaArbitral.findMany({
    where: { refereeId: { not: null }, match: { tenantId: id } },
    include: { referee: true },
  });

  const partidosPorArbitro = await prisma.match.groupBy({
    by: ["refereeId"],
    where: { tenantId: id, refereeId: { not: null } },
    _count: { _all: true },
  });
  const totalPartidos: Record<string, number> = {};
  partidosPorArbitro.forEach((p) => {
    if (p.refereeId) totalPartidos[p.refereeId] = p._count._all;
  });

  const grupos: Record<string, typeof encuestas> = {};
  encuestas.forEach((e) => {
    if (!e.refereeId) return;
    (grupos[e.refereeId] ??= []).push(e);
  });

  const prom = (arr: number[]) =>
    arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : 0;

  const ranking = Object.entries(grupos).map(([refereeId, lista]) => {
    const p1 = prom(lista.map((e) => e.q1));
    const p2 = prom(lista.map((e) => e.q2));
    const p3 = prom(lista.map((e) => e.q3));
    const p4 = prom(lista.map((e) => e.q4));
    const p5 = prom(lista.map((e) => e.q5));

    return {
      refereeId,
      nombre: lista[0].referee?.name ?? "Árbitro",
      respuestas: lista.length,
      partidos: totalPartidos[refereeId] ?? 0,
      partidosEvaluados: new Set(lista.map((e) => e.matchId)).size,
      p1, p2, p3, p4, p5,
      general: prom([p1, p2, p3, p4, p5]),
      comentarios: lista
        .filter((e) => e.comentarios)
        .map((e) => ({ matchId: e.matchId, texto: e.comentarios as string })),
    };
  });

  ranking.sort((a, b) => b.general - a.general || b.respuestas - a.respuestas);

  return NextResponse.json({ ranking });
}