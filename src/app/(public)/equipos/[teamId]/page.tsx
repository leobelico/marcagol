import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EquipoPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      players: { include: { stats: true } },
      homeMatches: {
        where: { status: "FINISHED" },
        include: { awayTeam: true },
        orderBy: { date: "desc" },
      },
      awayMatches: {
        where: { status: "FINISHED" },
        include: { homeTeam: true },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!team) notFound();

  // Combinar y ordenar partidos
  const matches = [
    ...team.homeMatches.map((m) => ({ ...m, isHome: true, opponent: m.awayTeam })),
    ...team.awayMatches.map((m) => ({ ...m, isHome: false, opponent: m.homeTeam })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Stats del equipo
  let w = 0, d = 0, l = 0, gf = 0, ga = 0;
  team.homeMatches.forEach((m) => {
    gf += m.homeScore ?? 0; ga += m.awayScore ?? 0;
    if ((m.homeScore ?? 0) > (m.awayScore ?? 0)) w++;
    else if (m.homeScore === m.awayScore) d++;
    else l++;
  });
  team.awayMatches.forEach((m) => {
    gf += m.awayScore ?? 0; ga += m.homeScore ?? 0;
    if ((m.awayScore ?? 0) > (m.homeScore ?? 0)) w++;
    else if (m.homeScore === m.awayScore) d++;
    else l++;
  });

  return (
    <div className="space-y-8">

      {/* Header del equipo */}
      <div className="flex items-center gap-4">
        <Link href="/" className="text-gray-500 hover:text-white transition text-sm">← Posiciones</Link>
      </div>

      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-6">
        <h1 className="text-3xl font-black text-white">{team.name}</h1>
        <div className="flex gap-6 mt-4 text-sm">
          <div className="text-center">
            <p className="text-2xl font-black text-green-400">{w}</p>
            <p className="text-gray-500">Ganados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-gray-400">{d}</p>
            <p className="text-gray-500">Empates</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-red-400">{l}</p>
            <p className="text-gray-500">Perdidos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-white">{gf}</p>
            <p className="text-gray-500">Goles a favor</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-white">{ga}</p>
            <p className="text-gray-500">Goles en contra</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Jugadores */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-green-500 rounded-full inline-block" />
            Plantilla
          </h2>
          <div className="space-y-2">
            {team.players.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 text-sm w-6 text-center">{p.number ?? "-"}</span>
                  <div>
                    <p className="text-white font-medium text-sm">{p.name}</p>
                    <p className="text-gray-500 text-xs">{p.position ?? "—"}</p>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-gray-400">
                  <span className="text-green-400 font-bold">{p.stats[0]?.goals ?? 0} goles</span>
                  <span>{p.stats[0]?.assists ?? 0} asist.</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partidos jugados */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-500 rounded-full inline-block" />
            Partidos Jugados
          </h2>
          <div className="space-y-2">
            {matches.length === 0 && (
              <p className="text-gray-500 text-sm">No hay partidos jugados</p>
            )}
            {matches.map((m) => {
              const teamScore = m.isHome ? m.homeScore : m.awayScore;
              const oppScore = m.isHome ? m.awayScore : m.homeScore;
              const result = (teamScore ?? 0) > (oppScore ?? 0) ? "W" :
                             (teamScore ?? 0) < (oppScore ?? 0) ? "L" : "E";
              return (
                <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        {m.isHome ? "Local" : "Visitante"} vs {m.opponent.name}
                      </p>
                      <p className="text-white font-black text-lg">{teamScore} - {oppScore}</p>
                    </div>
                    <span className={`text-xs font-black px-3 py-1 rounded-full
                      ${result === "W" ? "bg-green-900 text-green-400" :
                        result === "L" ? "bg-red-900 text-red-400" :
                        "bg-gray-800 text-gray-400"}`}>
                      {result === "W" ? "GANADO" : result === "L" ? "PERDIDO" : "EMPATE"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(m.date).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}