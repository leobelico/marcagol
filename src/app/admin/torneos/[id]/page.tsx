import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function TorneoAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const torneo = await prisma.tenant.findUnique({
    where: { id },
    include: {
      teams: { include: { _count: { select: { players: true } } } },
      _count: { select: { matches: true, rounds: true } },
    },
  });

  if (!torneo) notFound();

  const dias: Record<string, string> = {
    MONDAY: "Lun", TUESDAY: "Mar", WEDNESDAY: "Mié",
    THURSDAY: "Jue", FRIDAY: "Vie", SATURDAY: "Sáb", SUNDAY: "Dom"
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-gray-500 hover:text-white transition text-sm">← Torneos</Link>
          <div className="flex-1">
            <p className="text-xs text-gray-500 uppercase tracking-widest">Admin</p>
            <h1 className="text-lg font-black text-white">{torneo.name}</h1>
          </div>
          <Link href={`http://${torneo.slug}.localhost:3000`} target="_blank"
            className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition">
            Ver sitio →
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Equipos", value: torneo.teams.length, color: "text-green-400" },
            { label: "Partidos", value: torneo._count.matches, color: "text-blue-400" },
            { label: "Jornadas", value: torneo._count.rounds, color: "text-purple-400" },
            { label: "Formato", value: torneo.roundTrip ? "Ida y vuelta" : "Solo ida", color: "text-yellow-400" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Configuración */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Configuración</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Inicio</p>
              <p className="text-white font-medium">
                {torneo.startDate ? new Date(torneo.startDate).toLocaleDateString("es-MX") : "Sin definir"}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Partidos por día</p>
              <p className="text-white font-medium">{torneo.matchesPerDay}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Duración</p>
              <p className="text-white font-medium">{torneo.matchDuration} min</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Días de juego</p>
              <p className="text-white font-medium">
                {torneo.matchDays.length > 0
                  ? torneo.matchDays.map(d => dias[d]).join(", ")
                  : "Sin definir"}
              </p>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: `/admin/torneos/${id}/equipos`, icon: "👥", title: "Equipos", desc: `${torneo.teams.length} equipos registrados`, color: "hover:border-green-700" },
            { href: `/admin/torneos/${id}/calendario`, icon: "📅", title: "Calendario", desc: torneo._count.rounds > 0 ? `${torneo._count.rounds} jornadas generadas` : "Sin calendario aún", color: "hover:border-blue-700" },
            { href: `/admin/torneos/${id}/resultados`, icon: "⚽", title: "Resultados", desc: `${torneo._count.matches} partidos`, color: "hover:border-purple-700" },
            { href: `/admin/torneos/${id}/arbitros`, icon: "🟨", title: "Árbitros", desc: "Gestionar árbitros", color: "hover:border-yellow-700" },
            { href: `/admin/torneos/${id}/finanzas`, icon: "💰", title: "Finanzas", desc: "Ingresos y egresos", color: "hover:border-emerald-700" },
          ].map((a) => (
            <Link key={a.href} href={a.href}
              className={`bg-gray-900 border border-gray-800 ${a.color} rounded-2xl p-6 transition group`}>
              <p className="text-3xl mb-3">{a.icon}</p>
              <h3 className="text-white font-bold text-lg group-hover:text-white">{a.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{a.desc}</p>
            </Link>
          ))}
        </div>

        {/* Equipos */}
        {torneo.teams.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Equipos</h2>
              <Link href={`/admin/torneos/${id}/equipos`} className="text-xs text-green-400 hover:text-green-300">
                Ver todos →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {torneo.teams.map((t) => (
                <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs mt-1">{t._count.players} jugadores</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}