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
      <div className="rounded-2xl bg-gradient-to-br from-blue-950 via-gray-900 to-gray-950 border border-blue-900/30 p-5 sm:p-8">
        <p className="text-blue-400 text-xs font-bold tracking-widest uppercase mb-2">📅 Próximos partidos</p>
        <h1 className="t-titulo text-5xl text-white sm:text-6xl">Rol semanal</h1>
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
              <div className="px-4 py-3 border-b border-gray-800 sm:px-6 sm:py-4">
                <h2 className="t-titulo text-2xl text-white">{jornada}</h2>
              </div>
              <div className="divide-y divide-gray-800">
                {matches.map((m) => (
                  <div key={m.id} className="px-4 py-3 sm:px-6 sm:py-4">
                    <p className="mb-2 text-center text-xs text-gray-500">
                      {new Date(m.date).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short", timeZone: "America/Mexico_City" })}
                      {" · "}
                      {new Date(m.date).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" })}
                      {m.cancha ? ` · Cancha ${m.cancha}` : ""}
                    </p>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right text-sm font-semibold text-white">
                        <span className="truncate">{m.homeTeam.name}</span>
                        <Escudo logo={m.homeTeam.logo} nombre={m.homeTeam.name} />
                      </span>
                      <span className="shrink-0 rounded bg-gray-800 px-2.5 py-1 text-xs font-black text-gray-400">VS</span>
                      <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-white">
                        <Escudo logo={m.awayTeam.logo} nombre={m.awayTeam.name} />
                        <span className="truncate">{m.awayTeam.name}</span>
                      </span>
                    </div>
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
function Escudo({ logo, nombre }: { logo: string | null; nombre: string }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-700 bg-gray-800">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={nombre} className="h-full w-full object-cover" />
      ) : (
        <span className="text-[10px]">⚽</span>
      )}
    </span>
  );
}
