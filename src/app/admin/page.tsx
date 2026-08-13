import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import TorneoCard from "./TorneoCard";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isSuperAdmin = (session.user as any).isSuperAdmin;

if (!isSuperAdmin) {
  const tenantUser = await prisma.tenantUser.findFirst({
    where: { userId: session.user.id },
    });

    if (!tenantUser) redirect("/login");

    if (tenantUser.role === "CAPTAIN") {
      redirect("/capitan");
    }

    if (tenantUser.role !== "ADMIN") {
      redirect("/login");
    }
  }

  const torneos = isSuperAdmin
    ? await prisma.tenant.findMany({
        include: { _count: { select: { teams: true, matches: true } } },
        orderBy: { createdAt: "desc" },
      })
    : await prisma.tenant.findMany({
        where: {
          users: {
            some: { userId: session.user.id, role: "ADMIN" },
          },
        },
        include: { _count: { select: { teams: true, matches: true } } },
        orderBy: { createdAt: "desc" },
      });

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "marcagol.site";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Panel de Control</p>
            <h1 className="text-lg font-black text-white">
              {isSuperAdmin ? "⚽ Super Admin" : "⚽ Admin de Liga"}
            </h1>
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
            <h2 className="text-2xl font-black text-white">
              {isSuperAdmin ? "Todos los Torneos" : "Mis Ligas"}
            </h2>
            <p className="text-gray-500 text-sm mt-1">{torneos.length} torneos registrados</p>
          </div>
          {isSuperAdmin && (
            <div className="flex gap-3">
              <Link href="/admin/roladmin"
                className="bg-red-700 hover:bg-gray-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">
                ROL ADMINISTRATIVO
              </Link>
              <Link href="/admin/subadmins"
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">
                👥 Sub Admins
              </Link>
              <Link href="/admin/torneos/nuevo"
                className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">
                + Nuevo Torneo
              </Link>
              <Link href="/admin/importar"
                className="bg-blue-700 hover:bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">
                Importar
              </Link>
            </div>
          )}
        </div>

        {torneos.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl">
            <p className="text-4xl mb-4">⚽</p>
            <p className="text-gray-400 font-medium">No hay torneos aún</p>
            <p className="text-gray-600 text-sm mt-1">Crea tu primer torneo para empezar</p>
            {isSuperAdmin && (
              <Link href="/admin/torneos/nuevo"
                className="inline-block mt-6 bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-xl transition text-sm">
                Crear Torneo
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {torneos.map((t) => (
              <TorneoCard key={t.id} t={t} isSuperAdmin={isSuperAdmin} appDomain={appDomain} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}