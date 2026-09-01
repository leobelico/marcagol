import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import TorneoCard from "./TorneoCard";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    archivados?: string;
    carpeta?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;

  const verArchivados = params.archivados === "true";
  const carpetaId = params.carpeta || null;

  const isSuperAdmin = (session.user as any).isSuperAdmin;
const organizationId =
  (session.user as any).organizationId;
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

          ...(carpetaId
            ? {
                folderId: carpetaId,
              }
            : {
                folderId: null,
              }),
        },

        include: {
          folder: true,

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

          ...(carpetaId
            ? {
                folderId: carpetaId,
              }
            : {
                folderId: null,
              }),
        },

        include: {
          folder: true,

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
  // OBTENER CARPETAS
  // =========================================================

  const carpetas = isSuperAdmin
    ? await prisma.tenantFolder.findMany({
        include: {
          _count: {
            select: {
              tenants: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      })
    : await prisma.tenantFolder.findMany({
        where: {
          tenants: {
            some: {
              users: {
                some: {
                  userId: session.user.id,
                  role: "ADMIN",
                },
              },
            },
          },
        },

        include: {
          _count: {
            select: {
              tenants: true,
            },
          },
        },

        orderBy: {
          name: "asc",
        },
      });

  // =========================================================
  // CARPETA ACTUAL
  // =========================================================

  let carpetaActual = null;

  if (carpetaId) {
    carpetaActual = await prisma.tenantFolder.findUnique({
      where: {
        id: carpetaId,
      },
    });

    // Si la carpeta no existe, regresamos al inicio.
    if (!carpetaActual) {
      redirect(
        verArchivados
          ? "/admin?archivados=true"
          : "/admin"
      );
    }
  }

  // =========================================================
  // DOMINIO
  // =========================================================

  const appDomain =
    process.env.NEXT_PUBLIC_APP_DOMAIN || "marcagol.site";

  // =========================================================
  // URL BASE
  // =========================================================

  const baseUrl = verArchivados
    ? "/admin?archivados=true"
    : "/admin";

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

        {/* =====================================================
            TITULO Y BOTONES
        ===================================================== */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>

            <div className="flex items-center gap-3">

              {carpetaActual && (
                <Link
                  href={baseUrl}
                  className="text-gray-400 hover:text-white transition"
                  title="Volver"
                >
                  ←
                </Link>
              )}

              <h2 className="text-2xl font-black text-white">
                {carpetaActual
                  ? `📁 ${carpetaActual.name}`
                  : verArchivados
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
                : carpetaActual
                  ? "torneos en esta carpeta"
                  : "torneos sin carpeta"}
            </p>

          </div>

          {/* BOTONES */}

          <div className="flex flex-wrap gap-3">

            {/* VOLVER A TODAS */}
            {carpetaActual && (
              <Link
                href={baseUrl}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm"
              >
                ← Todas las ligas
              </Link>
            )}

            {/* CARPETAS */}
            {!verArchivados && !carpetaActual && isSuperAdmin && (
            <Link
              href={`/admin/carpetas/nueva?organizationId=${organizationId}`}
              className="bg-blue-700 hover:bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm"
            >
              📁 Nueva carpeta
            </Link>
            )}

            {/* ACTIVOS / ARCHIVADOS */}
            {!carpetaActual && (
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
            )}

            {/* SOLO SUPER ADMIN */}
            {isSuperAdmin &&
              !verArchivados &&
              !carpetaActual && (
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
            CARPETAS
        ===================================================== */}

        {!carpetaActual &&
          !verArchivados &&
          carpetas.length > 0 && (

            <section>

              <div className="flex items-center justify-between mb-4">

                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                  📁 Carpetas
                </h3>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {carpetas.map((carpeta) => (
                  <div
                    key={carpeta.id}
                    className="relative"
                  >

                    <Link
                      href={`/admin?carpeta=${carpeta.id}`}
                      className="block bg-gray-900 border border-gray-800 hover:border-purple-700 rounded-2xl p-5 transition group"
                    >

                      <div className="flex items-center gap-4">

                        <div className="w-12 h-12 rounded-xl bg-purple-900/30 flex items-center justify-center text-2xl">
                          📁
                        </div>

                        <div className="min-w-0">

                          <h3 className="font-bold text-white group-hover:text-purple-400 transition truncate">
                            {carpeta.name}
                          </h3>

                          <p className="text-sm text-gray-500">
                            {carpeta._count.tenants}{" "}
                            {carpeta._count.tenants === 1
                              ? "torneo"
                              : "torneos"}
                          </p>

                        </div>

                      </div>

                    </Link>

                  </div>
                ))}

              </div>

            </section>
          )}

        {/* =====================================================
            SIN CARPETA
        ===================================================== */}

        {!carpetaActual &&
          !verArchivados &&
          torneos.length > 0 && (

            <div>

              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                ⚽ Sin carpeta
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {torneos.map((t) => (
                  <TorneoCard
                    key={t.id}
                    t={t}
                    isSuperAdmin={isSuperAdmin}
                    appDomain={appDomain}
                    carpetas={carpetas}
                  />
                ))}

              </div>

            </div>
          )}

        {/* =====================================================
            TORNEOS DENTRO DE CARPETA
        ===================================================== */}

        {carpetaActual && (

          torneos.length === 0 ? (

            <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl">

              <p className="text-4xl mb-4">
                📁
              </p>

              <p className="text-gray-400 font-medium">
                Esta carpeta está vacía
              </p>

              <p className="text-gray-600 text-sm mt-1">
                Mueve un torneo aquí desde el menú ⋮
              </p>

            </div>

          ) : (

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {torneos.map((t) => (
                <TorneoCard
                  key={t.id}
                  t={t}
                  isSuperAdmin={isSuperAdmin}
                  appDomain={appDomain}
                  carpetas={carpetas}
                />
              ))}

            </div>

          )
        )}

        {/* =====================================================
            ARCHIVADOS
        ===================================================== */}

        {verArchivados && (

          torneos.length === 0 ? (

            <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl">

              <p className="text-4xl mb-4">
                🗄️
              </p>

              <p className="text-gray-400 font-medium">
                No hay torneos archivados
              </p>

              <p className="text-gray-600 text-sm mt-1">
                Los torneos que archives aparecerán aquí
              </p>

              <Link
                href="/admin"
                className="inline-block mt-6 bg-gray-700 hover:bg-gray-600 text-white font-bold px-6 py-3 rounded-xl transition text-sm"
              >
                ⚽ Ver Torneos Activos
              </Link>

            </div>

          ) : (

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {torneos.map((t) => (
                <TorneoCard
                  key={t.id}
                  t={t}
                  isSuperAdmin={isSuperAdmin}
                  appDomain={appDomain}
                  carpetas={carpetas}
                />
              ))}

            </div>

          )
        )}

        {/* =====================================================
            SIN TORNEOS Y SIN CARPETA
        ===================================================== */}

        {!carpetaActual &&
          !verArchivados &&
          torneos.length === 0 &&
          carpetas.length === 0 && (

            <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl">

              <p className="text-4xl mb-4">
                ⚽
              </p>

              <p className="text-gray-400 font-medium">
                No hay torneos aún
              </p>

              <p className="text-gray-600 text-sm mt-1">
                Crea tu primer torneo para empezar
              </p>

              {isSuperAdmin && (
                <Link
                  href="/admin/torneos/nuevo"
                  className="inline-block mt-6 bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-xl transition text-sm"
                >
                  Crear Torneo
                </Link>
              )}

            </div>

          )}

      </main>
    </div>
  );
}