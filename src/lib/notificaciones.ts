import { sendWhatsApp } from "./whatsapp";
import { prisma } from "./prisma";

// Notificar calendario generado a todos los capitanes
export async function notificarCalendario(tenantId: string) {
  const torneo = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      teams: {
        where: { phone: { not: null } },
        include: {
          homeMatches: {
            include: { awayTeam: true, round: true },
            where: { status: "SCHEDULED" },
            orderBy: { date: "asc" },
            take: 3,
          },
        },
      },
    },
  });

  if (!torneo) return;

  const resultados = [];

  for (const team of torneo.teams) {
    if (!team.phone) continue;

    const partidos = team.homeMatches.map((m) => {
      const fecha = new Date(m.date).toLocaleDateString("es-MX", {
        weekday: "short", day: "numeric", month: "short",
      });
      return `• ${m.round?.name ?? "Partido"}: vs ${m.awayTeam.name} — ${fecha}`;
    });

    const mensaje = [
      `⚽ *${torneo.name}*`,
      ``,
      `Hola${team.captain ? ` ${team.captain}` : ""}! El calendario del torneo ya está listo.`,
      ``,
      `*Próximos partidos de ${team.name}:*`,
      ...partidos,
      ``,
      `Consulta el calendario completo en:`,
      `http://${torneo.slug}.marcagol.com.mx/calendario`,
    ].join("\n");

    try {
      await sendWhatsApp(team.phone, mensaje);
      resultados.push({ team: team.name, ok: true });
    } catch (e: any) {
      resultados.push({ team: team.name, ok: false, error: e.message });
    }
  }

  return resultados;
}

// Notificar partido pospuesto o cancelado
export async function notificarCambioPartido(matchId: string, tipo: "CANCELLED" | "POSTPONED") {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
      tenant: true,
      round: true,
    },
  });

  if (!match) return;

  const fecha = new Date(match.date).toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long",
  });

  const tipoMsg = tipo === "CANCELLED" ? "❌ CANCELADO" : "⏰ POSPUESTO";

  const equipos = [match.homeTeam, match.awayTeam].filter((t) => t.phone);

  for (const equipo of equipos) {
    if (!equipo.phone) continue;

    const rival = equipo.id === match.homeTeamId ? match.awayTeam : match.homeTeam;
    const mensaje = [
      `${tipoMsg} — *${match.tenant.name}*`,
      ``,
      `El partido de *${equipo.name}* vs *${rival.name}*`,
      `programado para el ${fecha} ha sido ${tipo === "CANCELLED" ? "cancelado" : "pospuesto"}.`,
      ``,
      `Pendiente confirmación de nueva fecha.`,
      ``,
      `Cualquier duda contacta al organizador.`,
    ].join("\n");

    try {
      await sendWhatsApp(equipo.phone, mensaje);
    } catch (e) {
      console.error("Error enviando WhatsApp:", e);
    }
  }
}

// Notificar resultado de partido
export async function notificarResultado(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
      tenant: true,
      round: true,
    },
  });

  if (!match || match.status !== "FINISHED") return;

  const equipos = [match.homeTeam, match.awayTeam].filter((t) => t.phone);

  for (const equipo of equipos) {
    if (!equipo.phone) continue;

    const esLocal = equipo.id === match.homeTeamId;
    const golesEquipo = esLocal ? match.homeScore : match.awayScore;
    const golesRival = esLocal ? match.awayScore : match.homeScore;
    const rival = esLocal ? match.awayTeam : match.homeTeam;

    const resultado =
      golesEquipo! > golesRival! ? "🏆 VICTORIA" :
      golesEquipo! < golesRival! ? "😔 DERROTA" : "🤝 EMPATE";

    const mensaje = [
      `${resultado} — *${match.tenant.name}*`,
      ``,
      `*${match.homeTeam.name} ${match.homeScore} - ${match.awayScore} ${match.awayTeam.name}*`,
      `${match.round?.name ?? ""}`,
      ``,
      `Ver tabla de posiciones:`,
      `http://${match.tenant.slug}.marcagol.com.mx/posiciones`,
    ].join("\n");

    try {
      await sendWhatsApp(equipo.phone, mensaje);
    } catch (e) {
      console.error("Error enviando WhatsApp:", e);
    }
  }
}