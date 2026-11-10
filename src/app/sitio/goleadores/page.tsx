import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function GoleadoresPage() {
  const tenant = await getTenant();
  if (!tenant) notFound();

  const players = await prisma.player.findMany({
    where: { team: { tenantId: tenant.id } },
    include: { stats: true, team: true },
  });

  // Ordenar en JavaScript por goles
  const sorted = players.sort((a, b) => (b.stats[0]?.goals ?? 0) - (a.stats[0]?.goals ?? 0));

  return (
    <div>
      <h1 className="t-titulo mb-6 text-5xl text-white">Tabla de Goleadores</h1>
      <div className="rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-2 py-3 sm:px-4 text-left">#</th>
              <th className="px-2 py-3 sm:px-4 text-left">Jugador</th>
              <th className="px-2 py-3 sm:px-4 text-left hidden sm:table-cell">Equipo</th>
              <th className="px-2 py-3 sm:px-4 text-center"><span className="sm:hidden">G</span><span className="hidden sm:inline">Goles</span></th>
              <th className="px-2 py-3 sm:px-4 text-center"><span className="sm:hidden">A</span><span className="hidden sm:inline">Asistencias</span></th>
              <th className="px-2 py-3 sm:px-4 text-center">TA</th>
              <th className="px-2 py-3 sm:px-4 text-center">TR</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={p.id} className="border-t border-gray-800 hover:bg-gray-900 transition">
                <td className="px-2 py-3 sm:px-4 text-gray-500">{i + 1}</td>
                <td className="px-2 py-3 sm:px-4 font-medium text-white">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <span className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
                    {p.photo ? (
                      <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-500">👤</span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate">{p.name}</span>
                    <span className="block truncate text-xs font-normal text-gray-500 sm:hidden">{p.team.name}</span>
                  </span>
                </div>
              </td>
                <td className="px-2 py-3 sm:px-4 text-gray-400 hidden sm:table-cell">{p.team.name}</td>
                <td className="px-2 py-3 sm:px-4 text-center font-bold text-green-400">{p.stats[0]?.goals ?? 0}</td>
                <td className="px-2 py-3 sm:px-4 text-center text-gray-400">{p.stats[0]?.assists ?? 0}</td>
                <td className="px-2 py-3 sm:px-4 text-center text-yellow-400">{p.stats[0]?.yellow ?? 0}</td>
                <td className="px-2 py-3 sm:px-4 text-center text-red-400">{p.stats[0]?.red ?? 0}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No hay estadísticas registradas aún
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}