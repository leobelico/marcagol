import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function RolSemanalPage() {
  const tenant = await getTenant();
  if (!tenant) notFound();

  const partidos = await prisma.match.findMany({
    where: {
      tenantId: tenant.id,
      status: "SCHEDULED",
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      round: true,
    },
    orderBy: { date: "asc" },
  });

  // Agrupar por jornada
  const porJornada = partidos.reduce((acc, m) => {
    const key = m.round?.name ?? `Jornada ${m.round?.number ?? "?"}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {} as Record<string, typeof partidos>);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-br from-blue-950 via-gray-900 to-gray-950 border border-blue-900/30 p-8">
        <p className="text-blue-400 text-xs font-bold tracking-widest uppercase mb-2">📅 Próximos partidos</p>
        <h1 className="text-4xl font-black text-white">Rol Semanal</h1>
        <p className="text-gray-500 mt-1 text-sm">{partidos.length} partidos pendientes</p>
      </div>

      {partidos.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl">
          <p className="text-4xl mb-4">✅</p>
          <p className="text-gray-400 font-medium">No hay partidos pendientes</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(porJornada).map(([jornada, matches]) => (
            <div key={jornada} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="text-white font-bold">{jornada}</h2>
              </div>
              <div className="divide-y divide-gray-800">
                {matches.map((m) => (
                  <div key={m.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <span className="text-white font-semibold text-sm text-right flex-1">{m.homeTeam.name}</span>
                    <div className="text-center">
                      <span className="bg-gray-800 text-gray-400 text-xs font-black px-3 py-1 rounded">VS</span>
                      <p className="text-gray-600 text-xs mt-1">
                       {new Date(m.date).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short", timeZone: "America/Mexico_City" })}
                        {" · "}
                        {new Date(m.date).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" })}
                        {m.cancha ? ` · C${m.cancha}` : ""}
                      </p>
                    </div>
                    <span className="text-white font-semibold text-sm flex-1">{m.awayTeam.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}