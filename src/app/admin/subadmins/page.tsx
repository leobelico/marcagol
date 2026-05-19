import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSubAdmin, deleteSubAdmin } from "./actions";

export default async function SubAdminsPage() {
  const session = await auth();
  if (!(session?.user as any)?.isSuperAdmin) redirect("/admin");

  const torneos = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
  });

  const subAdmins = await prisma.tenantUser.findMany({
    where: { role: "ADMIN" },
    include: {
      user: true,
      tenant: true,
    },
    orderBy: { tenant: { name: "asc" } },
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Panel de Control</p>
            <h1 className="text-lg font-black text-white">👥 Sub Admins</h1>
          </div>
          <Link href="/admin" className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition">
            ← Volver
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">

        {/* Formulario para crear sub admin */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-black mb-6">Agregar Sub Admin</h2>
          <form action={createSubAdmin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Nombre</label>
                <input
                  name="name"
                  required
                  placeholder="Juan Pérez"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="juan@email.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Contraseña</label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Liga asignada</label>
                <select
                  name="tenantId"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
                >
                  <option value="">Selecciona una liga</option>
                  {torneos.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2.5 rounded-xl transition text-sm"
            >
              Crear Sub Admin
            </button>
          </form>
        </div>

        {/* Lista de sub admins */}
        <div>
          <h2 className="text-lg font-black mb-4">Sub Admins activos</h2>
          {subAdmins.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-800 rounded-2xl">
              <p className="text-gray-500">No hay sub admins aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subAdmins.map((sa) => (
                <div key={sa.id} className="bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">{sa.user.name}</p>
                    <p className="text-gray-400 text-sm">{sa.user.email}</p>
                    <p className="text-green-400 text-xs mt-1">⚽ {sa.tenant.name}</p>
                  </div>
                  <form action={deleteSubAdmin.bind(null, sa.userId, sa.tenantId)}>
                    <button
                      type="submit"
                      className="text-xs bg-red-900/40 hover:bg-red-900/70 text-red-400 px-4 py-2 rounded-lg transition"
                    >
                      Quitar acceso
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}