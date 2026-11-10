import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ChampionAnimation from "@/app/components/ChampionAnimation"; // ajusta la ruta a la tuya
export default async function PosicionesPage() {
  const tenant = await getTenant();
  if (!tenant) {
  console.log("TENANT NOT FOUND - slug buscado desde header");
  notFound();
}
const teams = await prisma.team.findMany({
    where: { tenantId: tenant.id },
    include: {
      homeMatches: { where: { status: "FINISHED", round: { bracketStage: null } } },
      awayMatches: { where: { status: "FINISHED", round: { bracketStage: null } } },
    },
  });

  const upcomingMatches = await prisma.match.findMany({
    where: { tenantId: tenant.id, status: "SCHEDULED" },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { date: "asc" },
    take: 4,
  });

  const recentMatches = await prisma.match.findMany({
    where: { tenantId: tenant.id, status: "FINISHED" },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { date: "desc" },
    take: 5,
  });
const bracketRounds = await prisma.round.findMany({
    where: { tenantId: tenant.id, bracketStage: { not: null } },
    include: {
      matches: {
        include: { homeTeam: true, awayTeam: true },
        orderBy: { bracketOrder: "asc" },
      },
    },
    orderBy: { bracketStage: "asc" },
  });

  const finalRound = bracketRounds.find(
    (r) => r.matches.length === 1 && r.matches[0].status === "FINISHED"
  );
  const finalMatch = finalRound?.matches[0];
  const campeon = finalMatch
    ? (finalMatch.homeScore ?? 0) > (finalMatch.awayScore ?? 0)
      ? finalMatch.homeTeam
      : finalMatch.awayTeam
    : null;

  // Top 3 goleadores del torneo (solo se consulta si hay campeón, ya que
  // únicamente se muestra dentro de la animación de campeón)
  const topScorersRaw = campeon
    ? await prisma.playerStat.findMany({
        where: { goals: { gt: 0 }, player: { team: { tenantId: tenant.id } } },
        orderBy: { goals: "desc" },
        take: 3,
        include: { player: true },
      })
    : [];

  const topScorers = topScorersRaw.map((s) => ({
    id: s.player.id,
    name: s.player.name,
    photo: s.player.photo,
    goals: s.goals,
  }));

  const standings = teams.map((team) => {
    let pts = 0, w = 0, d = 0, l = 0, gf = 0, ga = 0;
    team.homeMatches.forEach((m) => {
      gf += m.homeScore ?? 0; ga += m.awayScore ?? 0;
      if ((m.homeScore ?? 0) > (m.awayScore ?? 0)) { pts += 3; w++; }
      else if (m.homeScore === m.awayScore) { pts += 1; d++; }
      else l++;
    });
    team.awayMatches.forEach((m) => {
      gf += m.awayScore ?? 0; ga += m.homeScore ?? 0;
      if ((m.awayScore ?? 0) > (m.homeScore ?? 0)) { pts += 3; w++; }
      else if (m.homeScore === m.awayScore) { pts += 1; d++; }
      else l++;
    });
    return { team, pts, pj: w + d + l, w, d, l, gf, ga, dif: gf - ga };
}).sort((a, b) => b.pts - a.pts || b.dif - a.dif || b.gf - a.gf);

  return (
    <div className="space-y-8">
      {campeon && (
        <ChampionAnimation
          tenantId={tenant.id}
          teamName={campeon.name}
          teamLogo={campeon.logo}
          topScorers={topScorers}
        />
      )}
      {/* Encabezado: el nombre de la liga manda */}
      <header>
        <p className="text-sm font-semibold text-gray-500">
          Temporada 2026 · {teams.length} equipos · {recentMatches.length + upcomingMatches.length} partidos
        </p>
        <h1 className="t-titulo mt-2 text-5xl text-white [overflow-wrap:anywhere] sm:text-7xl">{tenant.name}</h1>
        <div className="t-escalones mt-5" aria-hidden="true" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 [&>*]:min-w-0">

        {/* Columna izquierda - Tabla + Resultados */}
        <div className="lg:col-span-2 space-y-10">

          {/* Tabla de posiciones */}
          <section aria-labelledby="t-tabla">
            <h2 id="t-tabla" className="t-titulo mb-4 text-3xl text-white">Tabla</h2>
            <div className="overflow-x-auto rounded-md border border-gray-800 bg-gray-900">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-white text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-2 py-3 sm:px-4 text-left">#</th>
                    <th className="px-2 py-3 sm:px-4 text-left">Equipo</th>
                    <th className="px-2 py-3 sm:px-4 text-center">PJ</th>
                    <th className="px-2 py-3 sm:px-4 text-center hidden sm:table-cell">G</th>
                    <th className="px-2 py-3 sm:px-4 text-center hidden sm:table-cell">E</th>
                    <th className="px-2 py-3 sm:px-4 text-center hidden sm:table-cell">P</th>
                    <th className="px-2 py-3 sm:px-4 text-center hidden md:table-cell">GF</th>
                    <th className="px-2 py-3 sm:px-4 text-center hidden md:table-cell">GC</th>
                    <th className="px-2 py-3 sm:px-4 text-center">DIF</th>
                    <th className="px-2 py-3 sm:px-4 text-center">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, i) => (
                    <tr
                      key={s.team.id}
                      className={`border-t border-gray-800 transition hover:bg-gray-800/50 ${
                        i === 0 ? "bg-[color-mix(in_srgb,#ffd400_16%,transparent)]" : ""
                      }`}
                    >
                      <td className="px-2 py-2.5 sm:px-4">
                        <span className={`t-numero text-2xl ${i < 3 ? "text-green-400" : "text-gray-500"}`}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 sm:px-4">
                        <Link href={`/equipos/${s.team.id}`} className="font-semibold text-white hover:text-green-400 transition flex min-w-0 items-center gap-2">
                          <span className="w-6 h-6 rounded-full overflow-hidden bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
                            {s.team.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={s.team.logo} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px]" aria-hidden="true">⚽</span>
                            )}
                          </span>
                          <span className="truncate">{s.team.name}</span>
                          {i === 0 && (
                            <span className="hidden shrink-0 rounded bg-[#ffd400] px-1.5 py-0.5 text-[10px] font-black uppercase text-[#12261a] sm:inline">
                              Líder
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="px-2 py-2.5 sm:px-4 text-center text-gray-400 tabular-nums">{s.pj}</td>
                      <td className="px-2 py-2.5 sm:px-4 text-center text-gray-400 tabular-nums hidden sm:table-cell">{s.w}</td>
                      <td className="px-2 py-2.5 sm:px-4 text-center text-gray-400 tabular-nums hidden sm:table-cell">{s.d}</td>
                      <td className="px-2 py-2.5 sm:px-4 text-center text-gray-400 tabular-nums hidden sm:table-cell">{s.l}</td>
                      <td className="px-2 py-2.5 sm:px-4 text-center text-gray-400 tabular-nums hidden md:table-cell">{s.gf}</td>
                      <td className="px-2 py-2.5 sm:px-4 text-center text-gray-400 tabular-nums hidden md:table-cell">{s.ga}</td>
                      <td className="px-2 py-2.5 sm:px-4 text-center font-semibold tabular-nums">
                        <span className={s.dif > 0 ? "text-green-400" : s.dif < 0 ? "text-red-400" : "text-gray-400"}>
                          {s.dif > 0 ? `+${s.dif}` : s.dif}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 sm:px-4 text-center">
                        <span className="t-numero text-2xl text-white">{s.pts}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Resultados recientes */}
          <section aria-labelledby="t-resultados">
            <h2 id="t-resultados" className="t-titulo mb-4 text-3xl text-white">Resultados</h2>
            {recentMatches.length === 0 && (
              <p className="text-sm text-gray-500">Todavía no hay partidos terminados.</p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {recentMatches.map((m) => {
                const hs = m.homeScore ?? 0;
                const as = m.awayScore ?? 0;
                const filas: [string, number, boolean][] = [
                  [m.homeTeam.name, hs, hs >= as],
                  [m.awayTeam.name, as, as >= hs],
                ];
                return (
                  <div key={m.id} className="t-boleto">
                    <div className="t-boleto__talon">
                      <span className="t-boleto__hora">
                        {new Date(m.date).toLocaleDateString("es-MX", { day: "numeric", timeZone: "America/Mexico_City" })}
                      </span>
                      <span className="t-boleto__dia">
                        {new Date(m.date).toLocaleDateString("es-MX", { month: "short", timeZone: "America/Mexico_City" })}
                      </span>
                    </div>
                    <div className="space-y-1.5 px-3 py-3">
                      {filas.map(([nombre, goles, gana], k) => (
                        <div key={k} className="flex items-center gap-2">
                          <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${gana ? "text-white" : "text-gray-500"}`}>
                            {nombre}
                          </span>
                          <span className={`t-numero text-2xl ${gana ? "text-white" : "text-gray-500"}`}>{goles}</span>
                        </div>
                      ))}
                      <span className="inline-flex items-center gap-1 rounded-full border border-gray-600 px-2 py-0.5 text-[11px] font-bold uppercase text-gray-400">
                        <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
                        Final
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>

        {/* Columna derecha - Próximos partidos y top */}
        <div className="space-y-10">
          <section aria-labelledby="t-proximos">
            <h2 id="t-proximos" className="t-titulo mb-4 text-3xl text-white">Próximos</h2>
            <div className="space-y-3">
              {upcomingMatches.length === 0 && (
                <p className="text-gray-500 text-sm">No hay partidos programados.</p>
              )}
              {upcomingMatches.map((m) => (
                <div key={m.id} className="t-boleto">
                  <div className="t-boleto__talon">
                    <span className="t-boleto__hora">
                      {new Date(m.date).toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                        timeZone: "America/Mexico_City",
                      })}
                    </span>
                    <span className="t-boleto__dia">
                      {new Date(m.date).toLocaleDateString("es-MX", {
                        weekday: "short",
                        day: "numeric",
                        timeZone: "America/Mexico_City",
                      })}
                    </span>
                  </div>
                  <div className="space-y-1.5 px-3 py-3">
                    <p className="truncate text-sm font-semibold text-white">{m.homeTeam.name}</p>
                    <p className="truncate text-sm font-semibold text-white">{m.awayTeam.name}</p>
                    <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-600 px-2 py-0.5 text-[11px] font-bold uppercase text-gray-400">
                      <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M8 4.5V8l2.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
                      Por jugar
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Top 3 equipos */}
          <section aria-labelledby="t-top">
            <h2 id="t-top" className="t-titulo mb-4 text-3xl text-white">Punteros</h2>
            <div className="divide-y divide-gray-800 border-y-2 border-white">
              {standings.slice(0, 3).map((s, i) => (
                <Link key={s.team.id} href={`/equipos/${s.team.id}`}
                  className="flex min-h-14 items-center gap-3 py-2 transition hover:bg-gray-900">
                  <span className="t-numero w-9 text-4xl text-green-400">{i + 1}</span>
                  <span className="text-white font-semibold text-sm flex-1 truncate">{s.team.name}</span>
                  <span className="t-numero text-3xl text-white">{s.pts}</span>
                  <span className="text-xs font-semibold text-gray-500">pts</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

      </div>

      {/* Liguilla / Bracket */}
      {bracketRounds.length > 0 && (
        <section aria-labelledby="t-liguilla">
          <h2 id="t-liguilla" className="t-titulo mb-4 text-3xl text-white">Liguilla</h2>
          <div className="flex gap-10 overflow-x-auto pb-4">
            {bracketRounds.map((round) => (
              <div key={round.id} className="flex flex-col justify-around gap-6 min-w-[240px]">
                <h3 className="t-titulo text-center text-xl text-green-400">
                  {round.bracketLabel ?? `Ronda ${round.bracketStage}`}
                </h3>
                {round.matches.map((m) => {
                  const finished = m.status === "FINISHED";
                  const homeWins = finished && (m.homeScore ?? 0) > (m.awayScore ?? 0);
                  const awayWins = finished && (m.awayScore ?? 0) > (m.homeScore ?? 0);
                  const filas: [string, number | null, boolean][] = [
                    [m.homeTeam.name, m.homeScore, homeWins],
                    [m.awayTeam.name, m.awayScore, awayWins],
                  ];
                  return (
                    <div key={m.id} className="overflow-hidden rounded-md border border-gray-800 bg-gray-900">
                      {filas.map(([nombre, goles, gana], k) => (
                        <div key={k} className={`flex items-center justify-between gap-3 px-3 py-2 ${k ? "border-t border-gray-800" : ""}`}>
                          <span className={`truncate text-sm font-semibold ${finished && !gana ? "text-gray-500" : "text-white"}`}>
                            {nombre}
                          </span>
                          <span className={`t-numero text-xl ${gana ? "text-green-400" : "text-white"}`}>
                            {finished ? goles : "–"}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
