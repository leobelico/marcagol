import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

const statusLabel: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: "Programado", color: "text-gray-400" },
  LIVE:      { label: "En vivo", color: "text-green-400 animate-pulse" },
  FINISHED:  { label: "Finalizado", color: "text-gray-500" },
  CANCELLED: { label: "Cancelado", color: "text-red-400" },
};

export default async function CalendarioPage() {
  const tenant = await getTenant();
  if (!tenant) notFound();

  const matches = await prisma.match.findMany({
    where: { tenantId: tenant.id },
    include: { homeTeam: true, awayTeam: true, referee: true },
    orderBy: { date: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-white">Calendario</h1>
      <div className="flex flex-col gap-3">
        {matches.map((m) => {
          const st = statusLabel[m.status];
          const fecha = new Date(m.date).toLocaleDateString("es-MX", {
            weekday: "long", day: "numeric", month: "long",
          });
          const hora = new Date(m.date).toLocaleTimeString("es-MX", {
            hour: "2-digit", minute: "2-digit",
          });

          return (
            <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500 capitalize">{fecha} — {hora}</span>
                <span className={`text-xs font-medium ${st.color}`}>{st.label}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-white font-semibold text-right flex-1">{m.homeTeam.name}</span>
                <div className="text-center min-w-[80px]">
                  {m.status === "FINISHED" ? (
                    <span className="text-2xl font-bold text-white">
                      {m.homeScore} - {m.awayScore}
                    </span>
                  ) : (
                    <span className="text-gray-500 text-sm">vs</span>
                  )}
                </div>
                <span className="text-white font-semibold flex-1">{m.awayTeam.name}</span>
              </div>
              {m.referee && (
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Árbitro: {m.referee.name}
                </p>
              )}
            </div>
          );
        })}
        {matches.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hay partidos programados aún
          </div>
        )}
      </div>
    </div>
  );
}