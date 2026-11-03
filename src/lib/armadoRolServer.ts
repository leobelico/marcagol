// src/lib/armadoRolServer.ts
//
// Carga de datos para el armado de rol semanal (una organización
// completa comparte las 3 canchas) y permisos a nivel organización.
import { NextResponse } from "next/server";
import { auth } from "./auth";
import { prisma } from "./prisma";
import type { LigaArmado, Ocupados } from "./armadoRol";
import {
  DIAS_DEFAULT,
  NUM_CANCHAS,
  claveCasilla,
  diaHoraDe,
  nivelSaturacion,
  ordenarHoras,
  parseCasillas,
  parseOpciones,
} from "./rol";

type OrgGuard = { organizationId: string; tenantIds: string[] } | { error: NextResponse };

/**
 * SUPER_ADMIN ve todas las ligas activas de la organización; un ADMIN
 * solo las ligas que administra dentro de ella.
 */
export async function requireOrgAdmin(organizationId: string | null | undefined): Promise<OrgGuard> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  if (!organizationId) {
    return { error: NextResponse.json({ error: "Falta la organización" }, { status: 400 }) };
  }

  const isSuperAdmin = !!(session.user as any).isSuperAdmin;
  const tenants = await prisma.tenant.findMany({
    where: {
      organizationId,
      archived: false,
      ...(isSuperAdmin ? {} : { users: { some: { userId: session.user.id, role: "ADMIN" } } }),
    },
    select: { id: true },
  });

  if (tenants.length === 0) {
    return {
      error: NextResponse.json({ error: "No tienes ligas en esta organización" }, { status: 403 }),
    };
  }
  return { organizationId, tenantIds: tenants.map((t) => t.id) };
}

export function diasDeLiga(matchDays: string[]) {
  return matchDays.length > 0 ? matchDays : DIAS_DEFAULT;
}

/** Ligas, equipos, preferencias e historial para armar la semana. */
export async function cargarArmado(tenantIds: string[], semana: Date) {
  const finSemana = new Date(semana.getTime() + 7 * 86400_000);

  const ligasDb = await prisma.tenant.findMany({
    where: { id: { in: tenantIds } },
    orderBy: { name: "asc" },
    include: {
      teams: { where: { disqualified: false }, orderBy: { name: "asc" } },
      preferenciasRol: { where: { semana } },
      matches: { select: { homeTeamId: true, awayTeamId: true, status: true } },
      _count: { select: { rounds: true } },
    },
  });

  const ligas: LigaArmado[] = ligasDb.map((l) => {
    const prefs = new Map(l.preferenciasRol.map((p) => [p.teamId, p]));
    return {
      id: l.id,
      name: l.name,
      categoria: l.categoria,
      dias: diasDeLiga(l.matchDays),
      horas: ordenarHoras(l.horarios),
      jornadas: l._count.rounds,
      historial: l.matches
        .filter((m) => m.status !== "CANCELLED")
        .map((m) => ({ homeId: m.homeTeamId, awayId: m.awayTeamId })),
      equipos: l.teams.map((t) => {
        const p = prefs.get(t.id);
        return {
          id: t.id,
          name: t.name,
          diaComprado: t.diaComprado,
          horaComprada: t.horaComprada,
          prioridadCompra: t.prioridadCompra,
          opciones: parseOpciones(p?.opciones),
          bloqueos: parseCasillas(p?.bloqueos),
          envioPreferencias: !!p,
        };
      }),
    };
  });

  // Canchas ya ocupadas esa semana por cualquier liga de la organización
  const orgIds = await prisma.tenant.findMany({
    where: { id: { in: tenantIds } },
    select: { organizationId: true },
  });
  const organizationId = orgIds[0]?.organizationId;
  const existentes = await prisma.match.findMany({
    where: {
      date: { gte: semana, lt: finSemana },
      cancha: { not: null },
      status: { not: "CANCELLED" },
      ...(organizationId ? { tenant: { organizationId } } : { tenantId: { in: tenantIds } }),
    },
    select: { date: true, cancha: true, tenantId: true },
  });
  const ocupados: Ocupados = existentes.map((m) => {
    const { dia, hora } = diaHoraDe(m.date);
    return `${claveCasilla(dia, hora)}|${m.cancha}`;
  });
  const ligasConPartidos = [...new Set(existentes.map((m) => m.tenantId))];

  return { ligas, ocupados, ligasConPartidos };
}

/**
 * Demanda por casilla en toda la organización: cuántos equipos la
 * tienen entre sus 3 primeras opciones (o la compraron) contra los
 * lugares que hay (3 canchas × 2 equipos).
 */
export async function saturacionOrganizacion(organizationId: string | null, tenantId: string, semana: Date) {
  const where = organizationId
    ? { tenant: { organizationId, archived: false }, semana }
    : { tenantId, semana };
  const prefs = await prisma.preferenciaRol.findMany({ where, select: { opciones: true } });
  const compradores = await prisma.team.findMany({
    where: {
      disqualified: false,
      ...(organizationId ? { tenant: { organizationId, archived: false } } : { tenantId }),
      diaComprado: { not: null },
      horaComprada: { not: null },
    },
    select: { diaComprado: true, horaComprada: true },
  });

  const demanda: Record<string, number> = {};
  for (const p of prefs) {
    for (const o of parseOpciones(p.opciones)) {
      if (o.prioridad <= 3) demanda[claveCasilla(o.dia, o.hora)] = (demanda[claveCasilla(o.dia, o.hora)] ?? 0) + 1;
    }
  }
  // Un horario comprado ya es un partido: ocupa 2 lugares
  for (const t of compradores) {
    const k = claveCasilla(t.diaComprado!, t.horaComprada!);
    demanda[k] = (demanda[k] ?? 0) + 2;
  }

  const lugares = NUM_CANCHAS * 2;
  const resultado: Record<string, { equipos: number; nivel: ReturnType<typeof nivelSaturacion> }> = {};
  for (const [k, equipos] of Object.entries(demanda)) {
    resultado[k] = { equipos, nivel: nivelSaturacion(equipos, lugares) };
  }
  return resultado;
}
