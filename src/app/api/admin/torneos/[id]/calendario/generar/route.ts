import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DIAS_MAP: Record<string, number> = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
  THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
};

const NUM_CANCHAS = 3;

// ============================================================
// SIGUIENTE FECHA QUE CAIGA EN UNO DE LOS DÍAS PERMITIDOS
// ============================================================

function nextMatchDate(from: Date, matchDays: string[]): Date {
  const date = new Date(from);
  const allowedDays = matchDays.map((d) => DIAS_MAP[d]);
  for (let i = 0; i < 14; i++) {
    if (allowedDays.includes(date.getDay())) return new Date(date);
    date.setDate(date.getDate() + 1);
  }
  return new Date(from);
}

// Siguiente fecha permitida DESPUÉS de "from" (salta al menos un día)
function nextMatchDateAfter(from: Date, matchDays: string[]): Date {
  const date = new Date(from);
  date.setDate(date.getDate() + 1);
  return nextMatchDate(date, matchDays);
}

function mismoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ============================================================
// ALGORITMO ROUND-ROBIN
// ============================================================

function generateRoundRobin(
  teams: { id: string; name: string }[]
): { home: string; away: string }[][] {
  const list = [...teams];
  if (list.length % 2 !== 0) list.push({ id: "bye", name: "BYE" });

  const n = list.length;
  const rounds: { home: string; away: string }[][] = [];

  for (let r = 0; r < n - 1; r++) {
    const round: { home: string; away: string }[] = [];
    for (let i = 0; i < n / 2; i++) {
      const home = list[i];
      const away = list[n - 1 - i];
      if (home.id !== "bye" && away.id !== "bye") {
        round.push({ home: home.id, away: away.id });
      }
    }
    rounds.push(round);
    // Rotar equipos (el primero fijo)
    list.splice(1, 0, list.pop()!);
  }

  return rounds;
}

// ============================================================
// GENERADOR DE SLOTS (fecha + hora + cancha) PARA UN DÍA
// ============================================================

function generarSlotsDelDia(
  fecha: Date,
  horaInicioMin: number, // minutos desde medianoche
  matchDuration: number,
  matchesPerDay: number
): { date: Date; cancha: number }[] {
  const slots: { date: Date; cancha: number }[] = [];

  for (let slot = 0; slot < matchesPerDay; slot++) {
    const minutos = horaInicioMin + slot * matchDuration;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;

    for (let cancha = 1; cancha <= NUM_CANCHAS; cancha++) {
      const slotDate = new Date(fecha);
      slotDate.setHours(horas, mins, 0, 0);
      slots.push({ date: slotDate, cancha });
    }
  }

  return slots;
}

// ============================================================
// POST - GENERAR CALENDARIO
// ============================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  // --------------------------------------------------
  // LEER BODY
  // --------------------------------------------------

  const body = await req.json().catch(() => ({}));

  const horaInicio: string =
    typeof body.horaInicio === "string" && /^\d{2}:\d{2}$/.test(body.horaInicio)
      ? body.horaInicio
      : "18:00";

  const [hIni, mIni] = horaInicio.split(":").map(Number);
  const horaInicioMin = hIni * 60 + mIni;

  const preferencias: { teamId: string; day: string }[] = Array.isArray(
    body.preferencias
  )
    ? body.preferencias.filter(
        (p: any) =>
          p &&
          typeof p.teamId === "string" &&
          typeof p.day === "string" &&
          DIAS_MAP[p.day] !== undefined
      )
    : [];

  const preferenciaPorEquipo: Record<string, string> = {};
  preferencias.forEach((p) => {
    preferenciaPorEquipo[p.teamId] = p.day;
  });

  // --------------------------------------------------
  // CARGAR TORNEO
  // --------------------------------------------------

  const torneo = await prisma.tenant.findUnique({
    where: { id },
    include: { teams: true },
  });

  if (!torneo)
    return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });

  if (torneo.teams.length < 2)
    return NextResponse.json(
      { error: "Necesitas al menos 2 equipos" },
      { status: 400 }
    );

  if (!torneo.startDate)
    return NextResponse.json(
      { error: "El torneo no tiene fecha de inicio" },
      { status: 400 }
    );

  if (torneo.matchDays.length === 0)
    return NextResponse.json(
      { error: "No hay días de juego configurados" },
      { status: 400 }
    );

  // --------------------------------------------------
  // CARGAR PARTIDOS YA OCUPADOS EN LA MISMA ORGANIZACIÓN
  // (fecha+hora+cancha ocupados, de cualquier torneo)
  // --------------------------------------------------

  const ocupados = new Set<string>();

  if (torneo.organizationId) {
    const partidosOrg = await prisma.match.findMany({
      where: {
        tenant: {
          organizationId: torneo.organizationId,
        },
        cancha: {
          not: null,
        },
      },
      select: {
        date: true,
        cancha: true,
      },
    });

    partidosOrg.forEach((m) => {
      ocupados.add(`${m.date.toISOString()}|${m.cancha}`);
    });
  }

  function slotLibre(date: Date, cancha: number): boolean {
    return !ocupados.has(`${date.toISOString()}|${cancha}`);
  }

  function marcarOcupado(date: Date, cancha: number) {
    ocupados.add(`${date.toISOString()}|${cancha}`);
  }

  // --------------------------------------------------
  // ELIMINAR CALENDARIO ANTERIOR
  // --------------------------------------------------

  await prisma.matchEvent.deleteMany({ where: { match: { tenantId: id } } });
  await prisma.match.deleteMany({ where: { tenantId: id } });
  await prisma.round.deleteMany({ where: { tenantId: id } });

  // --------------------------------------------------
  // GENERAR FIXTURE
  // --------------------------------------------------

  const fixture = generateRoundRobin(torneo.teams);
  let allRounds = [...fixture];

  if (torneo.roundTrip) {
    const vuelta = fixture.map((round) =>
      round.map((m) => ({ home: m.away, away: m.home }))
    );
    allRounds = [...fixture, ...vuelta];
  }

  // --------------------------------------------------
  // ASIGNAR FECHA + HORA + CANCHA A CADA PARTIDO
  // --------------------------------------------------

  const conflictos: {
    homeTeam: string;
    awayTeam: string;
    motivo: string;
  }[] = [];

  let currentDate = new Date(torneo.startDate);

  for (let i = 0; i < allRounds.length; i++) {
    const roundMatches = allRounds[i];

    let roundDate = nextMatchDate(currentDate, torneo.matchDays);

    // Crear jornada
    const round = await prisma.round.create({
      data: {
        number: i + 1,
        name:
          torneo.roundTrip && i >= fixture.length
            ? `Jornada ${i + 1} (Vuelta)`
            : `Jornada ${i + 1}`,
        tenantId: id,
      },
    });

    // ----------------------------------------------
    // ORDENAR PARTIDOS: primero los que tienen equipo
    // con preferencia de día, para intentar dárselo
    // ----------------------------------------------

    const partidosOrdenados = [...roundMatches].sort((a, b) => {
      const aPref = preferenciaPorEquipo[a.home] || preferenciaPorEquipo[a.away];
      const bPref = preferenciaPorEquipo[b.home] || preferenciaPorEquipo[b.away];
      if (aPref && !bPref) return -1;
      if (!aPref && bPref) return 1;
      return 0;
    });

    const partidosACrear: {
      tenantId: string;
      homeTeamId: string;
      awayTeamId: string;
      roundId: string;
      date: Date;
      cancha: number;
      status: "SCHEDULED";
    }[] = [];

    for (const m of partidosOrdenados) {
      const diaPreferido =
        preferenciaPorEquipo[m.home] || preferenciaPorEquipo[m.away];

      let fechaObjetivo = roundDate;

      // Si el equipo tiene preferencia y el día de la jornada
      // no coincide, buscar la fecha con ese día de la semana
      // más cercana a partir de roundDate (sin salirnos de la
      // jornada actual: solo movemos el día de la semana dentro
      // de la ventana de matchDays del torneo).
      if (diaPreferido && DIAS_MAP[diaPreferido] !== roundDate.getDay()) {
        if (torneo.matchDays.includes(diaPreferido)) {
          const candidata = new Date(roundDate);
          for (let d = 0; d < 7; d++) {
            if (candidata.getDay() === DIAS_MAP[diaPreferido]) break;
            candidata.setDate(candidata.getDate() + 1);
          }
          fechaObjetivo = candidata;
        }
      }

      // ----------------------------------------------
      // BUSCAR SLOT LIBRE EN fechaObjetivo; SI NO HAY,
      // AVANZAR DÍA POR DÍA (solo días permitidos por el
      // torneo) HASTA ENCONTRAR UNO
      // ----------------------------------------------

      let fechaBusqueda = new Date(fechaObjetivo);
      let slotEncontrado: { date: Date; cancha: number } | null = null;
      let intentos = 0;

      while (!slotEncontrado && intentos < 30) {
        const slotsDelDia = generarSlotsDelDia(
          fechaBusqueda,
          horaInicioMin,
          torneo.matchDuration,
          torneo.matchesPerDay
        );

        for (const slot of slotsDelDia) {
          if (slotLibre(slot.date, slot.cancha)) {
            slotEncontrado = slot;
            break;
          }
        }

        if (!slotEncontrado) {
          // Si era el día preferido y ya no hay espacio,
          // reportar conflicto y NO seguir buscando otro día
          // para este partido (se deja pendiente/manual)
          if (
            diaPreferido &&
            mismoDia(fechaBusqueda, fechaObjetivo) &&
            DIAS_MAP[diaPreferido] === fechaBusqueda.getDay()
          ) {
            conflictos.push({
              homeTeam: m.home,
              awayTeam: m.away,
              motivo: `Sin espacio disponible el día preferido (${diaPreferido}). Agrégalo manualmente.`,
            });
            break;
          }

          fechaBusqueda = nextMatchDateAfter(fechaBusqueda, torneo.matchDays);
          intentos++;
        }
      }

      if (!slotEncontrado) {
        if (
          !conflictos.some(
            (c) => c.homeTeam === m.home && c.awayTeam === m.away
          )
        ) {
          conflictos.push({
            homeTeam: m.home,
            awayTeam: m.away,
            motivo:
              "No se encontró horario/cancha disponible en la ventana de días del torneo. Agrégalo manualmente.",
          });
        }
        continue;
      }

      marcarOcupado(slotEncontrado.date, slotEncontrado.cancha);

      partidosACrear.push({
        tenantId: id,
        homeTeamId: m.home,
        awayTeamId: m.away,
        roundId: round.id,
        date: slotEncontrado.date,
        cancha: slotEncontrado.cancha,
        status: "SCHEDULED",
      });
    }

    if (partidosACrear.length > 0) {
      await prisma.match.createMany({
        data: partidosACrear,
      });
    }

    // Avanzar a la siguiente fecha de juego para la próxima jornada
    currentDate = new Date(roundDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // --------------------------------------------------
  // RESOLVER NOMBRES DE EQUIPOS PARA LOS CONFLICTOS
  // --------------------------------------------------

  const conflictosConNombre = conflictos.map((c) => {
    const home = torneo.teams.find((t) => t.id === c.homeTeam);
    const away = torneo.teams.find((t) => t.id === c.awayTeam);
    return {
      homeTeam: home?.name || c.homeTeam,
      awayTeam: away?.name || c.awayTeam,
      motivo: c.motivo,
    };
  });

  return NextResponse.json({
    ok: true,
    rounds: allRounds.length,
    conflictos: conflictosConNombre,
  });
}

// ============================================================
// DELETE - ELIMINAR CALENDARIO
// ============================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  await prisma.matchEvent.deleteMany({ where: { match: { tenantId: id } } });
  await prisma.match.deleteMany({ where: { tenantId: id } });
  await prisma.round.deleteMany({ where: { tenantId: id } });

  return NextResponse.json({ ok: true });
}