import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function PosicionesPage() {
  const tenant = await getTenant();
  if (!tenant) notFound();

  const teams = await prisma.team.findMany({
    where: { tenantId: tenant.id },
    include: {
      homeMatches: { where: { status: "FINISHED" } },
      awayMatches: { where: { status: "FINISHED" } },
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
  }).sort((a, b) => b.pts - a.pts || b.dif - a.dif);

  return (
    <div className="space-y-8">

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-green-950 via-gray-900 to-gray-950 border border-green-900/30 p-8">
        <p className="text-green-400 text-xs font-bold tracking-widest uppercase mb-2">⚽ Temporada 2026</p>
        <h1 className="text-4xl font-black text-white">{tenant.name}</h1>
        <p className="text-gray-500 mt-1 text-sm">{teams.length} equipos · {recentMatches.length + upcomingMatches.length} partidos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Columna izquierda - Tabla + Resultados */}
        <div className="lg:col-span-2 space-y-8">

          {/* Tabla de posiciones */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Tabla de Posiciones</h2>
            <div className="rounded-xl overflow-hidden border border-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Equipo</th>
                    <th className="px-4 py-3 text-center">PJ</th>
                    <th className="px-4 py-3 text-center">G</th>
                    <th className="px-4 py-3 text-center">E</th>
                    <th className="px-4 py-3 text-center">P</th>
                    <th className="px-4 py-3 text-center hidden md:table-cell">GF</th>
                    <th className="px-4 py-3 text-center hidden md:table-cell">GC</th>
                    <th className="px-4 py-3 text-center hidden md:table-cell">DIF</th>
                    <th className="px-4 py-3 text-center">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, i) => (
                    <tr key={s.team.id} className={`border-t border-gray-800 hover:bg-gray-800/50 transition ${i === 0 ? "bg-green-950/20" : ""}`}>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full
                          ${i === 0 ? "bg-yellow-500 text-black" :
                            i === 1 ? "bg-gray-400 text-black" :
                            i === 2 ? "bg-amber-700 text-white" :
                            "text-gray-500"}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/equipos/${s.team.id}`} className="font-semibold text-white hover:text-green-400 transition flex items-center gap-2">
                          {i === 0 && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold">LÍDER</span>}
                          {s.team.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400">{s.pj}</td>
                      <td className="px-4 py-3 text-center text-green-400 font-medium">{s.w}</td>
                      <td className="px-4 py-3 text-center text-gray-400">{s.d}</td>
                      <td className="px-4 py-3 text-center text-red-400">{s.l}</td>
                      <td className="px-4 py-3 text-center text-gray-400 hidden md:table-cell">{s.gf}</td>
                      <td className="px-4 py-3 text-center text-gray-400 hidden md:table-cell">{s.ga}</td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <span className={s.dif > 0 ? "text-green-400" : s.dif < 0 ? "text-red-400" : "text-gray-400"}>
                          {s.dif > 0 ? `+${s.dif}` : s.dif}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-black text-white text-base">{s.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resultados recientes */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Resultados Recientes</h2>
            <div className="rounded-xl overflow-hidden border border-gray-800">
              <table className="w-full text-sm">
                <tbody>
                  {recentMatches.map((m) => (
                    <tr key={m.id} className="border-t border-gray-800 first:border-0 hover:bg-gray-800/50 transition">
                      <td className="px-4 py-3 text-gray-500 text-xs w-20">
                        {new Date(m.date).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        <span className={(m.homeScore ?? 0) > (m.awayScore ?? 0) ? "text-white" : "text-gray-500"}>
                          {m.homeTeam.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-gray-800 text-white font-black px-3 py-1 rounded-lg text-sm">
                          {m.homeScore} - {m.awayScore}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        <span className={(m.awayScore ?? 0) > (m.homeScore ?? 0) ? "text-white" : "text-gray-500"}>
                          {m.awayTeam.name}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Sidebar - Próximos partidos */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Próximos Partidos</h2>
            <div className="space-y-3">
              {upcomingMatches.length === 0 && (
                <p className="text-gray-500 text-sm">No hay partidos programados</p>
              )}
              {upcomingMatches.map((m) => (
                <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-600 font-semibold uppercase mb-3">
                    {new Date(m.date).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" })}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white font-semibold text-sm text-right flex-1 truncate">{m.homeTeam.name}</span>
                    <span className="bg-gray-800 text-gray-500 text-xs font-black px-2 py-1 rounded">VS</span>
                    <span className="text-white font-semibold text-sm flex-1 truncate">{m.awayTeam.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 3 equipos */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Top Equipos</h2>
            <div className="space-y-2">
              {standings.slice(0, 3).map((s, i) => (
                <Link key={s.team.id} href={`/equipos/${s.team.id}`}
                  className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 hover:border-gray-600 transition">
                  <span className={`text-xs font-black w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0
                    ${i === 0 ? "bg-yellow-500 text-black" : i === 1 ? "bg-gray-400 text-black" : "bg-amber-700 text-white"}`}>
                    {i + 1}
                  </span>
                  <span className="text-white font-semibold text-sm flex-1">{s.team.name}</span>
                  <span className="text-green-400 font-black text-lg">{s.pts}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}