import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const torneos = await prisma.tenant.findMany({
    include: {
      _count: { select: { teams: true, matches: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Panel de Control</p>
            <h1 className="text-lg font-black text-white">⚽ Super Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{session.user?.email}</span>
            <Link href="/api/auth/signout" className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition">
              Cerrar sesión
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">Torneos</h2>
            <p className="text-gray-500 text-sm mt-1">{torneos.length} torneos registrados</p>
          </div>
          <Link href="/admin/torneos/nuevo"
            className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">
            + Nuevo Torneo
          </Link>
          
        </div>

        {torneos.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl">
            <p className="text-4xl mb-4">⚽</p>
            <p className="text-gray-400 font-medium">No hay torneos aún</p>
            <p className="text-gray-600 text-sm mt-1">Crea tu primer torneo para empezar</p>
            <Link href="/admin/torneos/nuevo"
              className="inline-block mt-6 bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-xl transition text-sm">
              Crear Torneo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {torneos.map((t) => (
              <Link key={t.id} href={`/admin/torneos/${t.id}`}
                className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl p-6 transition group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-green-900/40 rounded-xl flex items-center justify-center text-2xl">
                    ⚽
                  </div>
                  <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded-full font-bold">
                    Activo
                  </span>
                </div>
                <h3 className="text-white font-bold text-lg group-hover:text-green-400 transition">{t.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{t.slug}.tuapp.com</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-400"><span className="text-white font-bold">{t._count.teams}</span> equipos</span>
                  <span className="text-gray-400"><span className="text-white font-bold">{t._count.matches}</span> partidos</span>
                </div>
              </Link>
              
            ))}
          </div>
        )}
      </main>
    </div>
  );
}