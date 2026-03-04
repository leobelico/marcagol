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
      <h1 className="text-2xl font-bold mb-6 text-white">Tabla de Goleadores</h1>
      <div className="rounded-xl overflow-hidden border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Jugador</th>
              <th className="px-4 py-3 text-left">Equipo</th>
              <th className="px-4 py-3 text-center">Goles</th>
              <th className="px-4 py-3 text-center">Asistencias</th>
              <th className="px-4 py-3 text-center">TA</th>
              <th className="px-4 py-3 text-center">TR</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={p.id} className="border-t border-gray-800 hover:bg-gray-900 transition">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                <td className="px-4 py-3 text-gray-400">{p.team.name}</td>
                <td className="px-4 py-3 text-center font-bold text-green-400">{p.stats[0]?.goals ?? 0}</td>
                <td className="px-4 py-3 text-center text-gray-400">{p.stats[0]?.assists ?? 0}</td>
                <td className="px-4 py-3 text-center text-yellow-400">{p.stats[0]?.yellow ?? 0}</td>
                <td className="px-4 py-3 text-center text-red-400">{p.stats[0]?.red ?? 0}</td>
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