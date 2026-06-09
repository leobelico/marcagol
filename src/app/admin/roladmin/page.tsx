import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function RolAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isSuperAdmin = (session.user as any).isSuperAdmin;
  if (!isSuperAdmin) redirect("/admin");

  const partidos = await prisma.match.findMany({
    where: { status: "SCHEDULED" },
    include: {
      homeTeam: true,
      awayTeam: true,
      round: true,
      tenant: true,
    },
    orderBy: { date: "asc" },
  });

  // Agrupar por torneo
  const porTorneo = partidos.reduce((acc, m) => {
    const key = m.tenant.name;
    if (!acc[key]) acc[key] = { tenant: m.tenant, partidos: [] };
    acc[key].partidos.push(m);
    return acc;
  }, {} as Record<string, { tenant: any; partidos: typeof partidos }>);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-gray-500 hover:text-white transition text-sm">← Panel</Link>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Admin</p>
            <h1 className="text-lg font-black text-white">📋 Rol Administrativo</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="rounded-2xl bg-gradient-to-br from-red-950 via-gray-900 to-gray-950 border border-red-900/30 p-6">
          <p className="text-red-400 text-xs font-bold tracking-widest uppercase mb-1">Todos los torneos</p>
          <h2 className="text-3xl font-black text-white">Partidos pendientes</h2>
          <p className="text-gray-500 mt-1 text-sm">{partidos.length} partidos sin resultado</p>
        </div>

        {partidos.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl">
            <p className="text-4xl mb-4">✅</p>
            <p className="text-gray-400 font-medium">Todos los partidos tienen resultado</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(porTorneo).map(([nombre, { tenant, partidos }]) => (
              <div key={nombre}>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-white font-black text-xl">{nombre}</h3>
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
                    {partidos.length} pendientes
                  </span>
                  <Link href={`/admin/torneos/${tenant.id}`}
                    className="text-xs text-green-400 hover:text-green-300 ml-auto">
                    Ver torneo →
                  </Link>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="divide-y divide-gray-800">
                    {partidos.map((m) => (
                      <div key={m.id} className="px-6 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <span className="text-white font-semibold text-sm text-right flex-1">{m.homeTeam.name}</span>
                          <div className="text-center">
                            <span className="bg-gray-800 text-gray-400 text-xs font-black px-3 py-1 rounded">VS</span>
                          </div>
                          <span className="text-white font-semibold text-sm flex-1">{m.awayTeam.name}</span>
                        </div>
                        <div className="text-right text-xs text-gray-500 space-y-0.5">
                          <p>{m.round?.name ?? `Jornada ${m.round?.number}`}</p>
                          <p>{new Date(m.date).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })}</p>
                          <p>{new Date(m.date).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                            {m.cancha ? ` · C${m.cancha}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}