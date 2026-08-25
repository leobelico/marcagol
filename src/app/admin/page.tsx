import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import TorneoCard from "./TorneoCard";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ archivados?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const verArchivados = params.archivados === "true";

  const isSuperAdmin = (session.user as any).isSuperAdmin;

  // =========================================================
  // VALIDAR PERMISOS
  // =========================================================

  if (!isSuperAdmin) {
    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (!tenantUser) {
      redirect("/login");
    }

    if (tenantUser.role === "CAPTAIN") {
      redirect("/capitan");
    }

    if (tenantUser.role !== "ADMIN") {
      redirect("/login");
    }
  }

  // =========================================================
  // OBTENER TORNEOS
  // =========================================================

  const torneos = isSuperAdmin
    ? await prisma.tenant.findMany({
        where: {
          archived: verArchivados,
        },
        include: {
          _count: {
            select: {
              teams: true,
              matches: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    : await prisma.tenant.findMany({
        where: {
          archived: verArchivados,
          users: {
            some: {
              userId: session.user.id,
              role: "ADMIN",
            },
          },
        },
        include: {
          _count: {
            select: {
              teams: true,
              matches: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

  // =========================================================
  // DOMINIO
  // =========================================================

  const appDomain =
    process.env.NEXT_PUBLIC_APP_DOMAIN || "marcagol.site";

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* HEADER */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">
              Panel de Control
            </p>

            <h1 className="text-lg font-black text-white">
              {isSuperAdmin
                ? "⚽ Super Admin"
                : "⚽ Admin de Liga"}
            </h1>
          </div>

          <div className="flex items-center gap-4">

            <span className="text-sm text-gray-400">
              {session.user?.email}
            </span>

            <Link
              href="/api/auth/signout"
              className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition"
            >
              Cerrar sesión
            </Link>

          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* TITULO Y BOTONES */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>

            <div className="flex items-center gap-3">

              <h2 className="text-2xl font-black text-white">
                {verArchivados
                  ? "Torneos Archivados"
                  : isSuperAdmin
                    ? "Todos los Torneos"
                    : "Mis Ligas"}
              </h2>

              {verArchivados && (
                <span className="text-xs bg-yellow-900/40 text-yellow-400 border border-yellow-800 px-2 py-1 rounded-lg">
                  ARCHIVADOS
                </span>
              )}

            </div>

            <p className="text-gray-500 text-sm mt-1">
              {torneos.length}{" "}
              {verArchivados
                ? "torneos archivados"
                : "torneos registrados"}
            </p>

          </div>

          {/* BOTONES */}
          <div className="flex flex-wrap gap-3">

            {/* CAMBIAR ENTRE ACTIVOS / ARCHIVADOS */}
            <Link
              href={
                verArchivados
                  ? "/admin"
                  : "/admin?archivados=true"
              }
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm"
            >
              {verArchivados
                ? "⚽ Ver Torneos Activos"
                : "🗄️ Ver Archivados"}
            </Link>

            {/* SOLO SUPER ADMIN */}
            {isSuperAdmin && !verArchivados && (
              <>
                <Link
                  href="/admin/roladmin"
                  className="bg-red-700 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm"
                >
                  ROL ADMINISTRATIVO
                </Link>

                <Link
                  href="/admin/subadmins"
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm"
                >
                  👥 Sub Admins
                </Link>
                     <Link
                  href="/admin/capitanes"
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm"
                >
                  Capitanes
                </Link>
                <Link
                  href="/admin/torneos/nuevo"
                  className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm"
                >
                  + Nuevo Torneo
                </Link>

                <Link
                  href="/admin/importar"
                  className="bg-blue-700 hover:bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm"
                >
                  Importar
                </Link>
              </>
            )}

          </div>
        </div>

        {/* =====================================================
            SIN TORNEOS
        ===================================================== */}

        {torneos.length === 0 ? (

          <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl">

            <p className="text-4xl mb-4">
              {verArchivados ? "🗄️" : "⚽"}
            </p>

            <p className="text-gray-400 font-medium">
              {verArchivados
                ? "No hay torneos archivados"
                : "No hay torneos aún"}
            </p>

            <p className="text-gray-600 text-sm mt-1">
              {verArchivados
                ? "Los torneos que archives aparecerán aquí"
                : "Crea tu primer torneo para empezar"}
            </p>

            {/* CREAR TORNEO */}
            {isSuperAdmin && !verArchivados && (
              <Link
                href="/admin/torneos/nuevo"
                className="inline-block mt-6 bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-xl transition text-sm"
              >
                Crear Torneo
              </Link>
            )}

            {/* VOLVER A ACTIVOS */}
            {verArchivados && (
              <Link
                href="/admin"
                className="inline-block mt-6 bg-gray-700 hover:bg-gray-600 text-white font-bold px-6 py-3 rounded-xl transition text-sm"
              >
                ⚽ Ver Torneos Activos
              </Link>
            )}

          </div>

        ) : (

          /* =====================================================
             TORNEOS
          ===================================================== */

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {torneos.map((t) => (
              <TorneoCard
                key={t.id}
                t={t}
                isSuperAdmin={isSuperAdmin}
                appDomain={appDomain}
              />
            ))}

          </div>

        )}

      </main>
    </div>
  );
}