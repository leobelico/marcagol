// Armado de rol semanal — configuración y estado de la encuesta.
// GET   ?org=&semana=YYYY-MM-DD → ligas, equipos (compras + si ya mandaron horarios)
// PATCH { org, ligas?, equipos?, prefsForzadas? } → guarda la configuración
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SIN_ORG, requireOrgAdmin } from "@/lib/armadoRolServer";
import { DIAS, lunesDe, semanaObjetivo, ventanaAbierta, ymd } from "@/lib/rol";

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const guard = await requireOrgAdmin(sp.get("org"));
  if ("error" in guard) return guard.error;

  const semana = (sp.get("semana") && lunesDe(sp.get("semana")!)) || semanaObjetivo();

  const [org, ligas] = await Promise.all([
    guard.organizationId
      ? prisma.organization.findUnique({ where: { id: guard.organizationId }, select: { id: true, name: true } })
      : { id: SIN_ORG, name: "Ligas sin organización" },
    prisma.tenant.findMany({
      where: { id: { in: guard.tenantIds } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        categoria: true,
        horarios: true,
        matchDays: true,
        prefsAbiertas: true,
        teams: {
          where: { disqualified: false },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            diaComprado: true,
            horaComprada: true,
            prioridadCompra: true,
            preferenciasRol: { where: { semana }, select: { opciones: true, bloqueos: true, updatedAt: true } },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    // La encuesta se abre a mano para todo el grupo a la vez
    org: org && { ...org, prefsForzadas: ligas.some((l) => l.prefsAbiertas) },
    semana: ymd(semana),
    ventanaAbierta: ventanaAbierta(),
    ligas: ligas.map((l) => ({
      ...l,
      teams: l.teams.map(({ preferenciasRol, ...t }) => ({ ...t, preferencia: preferenciasRol[0] ?? null })),
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const guard = await requireOrgAdmin(body.org);
  if ("error" in guard) return guard.error;

  const permitidas = new Set(guard.tenantIds);
  const ops = [];

  if (typeof body.prefsForzadas === "boolean") {
    ops.push(
      prisma.tenant.updateMany({
        where: { id: { in: guard.tenantIds } },
        data: { prefsAbiertas: body.prefsForzadas },
      })
    );
  }

  for (const l of Array.isArray(body.ligas) ? body.ligas : []) {
    if (!l || !permitidas.has(l.id)) continue;
    const data: Record<string, unknown> = {};
    if (l.categoria === null || ["FEMENIL", "MIXTA", "VARONIL"].includes(l.categoria)) data.categoria = l.categoria;
    if (Array.isArray(l.horarios)) {
      const horas = l.horarios.filter((h: unknown) => typeof h === "string" && HORA.test(h));
      if (horas.length !== l.horarios.length) {
        return NextResponse.json({ error: "Horario inválido (usa HH:MM, p. ej. 20:30)" }, { status: 400 });
      }
      data.horarios = [...new Set(horas)].sort();
    }
    if (Array.isArray(l.matchDays)) {
      data.matchDays = DIAS.filter((d) => l.matchDays.includes(d));
    }
    ops.push(prisma.tenant.update({ where: { id: l.id }, data }));
  }

  const equipos = Array.isArray(body.equipos) ? body.equipos : [];
  if (equipos.length > 0) {
    const validos = await prisma.team.findMany({
      where: { id: { in: equipos.map((e: { id?: string }) => e?.id).filter(Boolean) }, tenantId: { in: guard.tenantIds } },
      select: { id: true },
    });
    const ids = new Set(validos.map((t) => t.id));
    for (const e of equipos) {
      if (!e || !ids.has(e.id)) continue;
      const dia = DIAS.includes(e.diaComprado) ? e.diaComprado : null;
      const hora = typeof e.horaComprada === "string" && HORA.test(e.horaComprada) ? e.horaComprada : null;
      const prioridad = Number.isInteger(e.prioridadCompra) && e.prioridadCompra > 0 ? e.prioridadCompra : null;
      ops.push(
        prisma.team.update({
          where: { id: e.id },
          data: {
            diaComprado: dia,
            horaComprada: hora,
            prioridadCompra: dia || hora ? prioridad : null,
          },
        })
      );
    }
  }

  await prisma.$transaction(ops);
  return NextResponse.json({ ok: true });
}
