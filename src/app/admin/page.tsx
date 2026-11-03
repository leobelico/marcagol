import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminHeader from "./AdminHeader";
import CarpetaAcciones from "./CarpetaAcciones";
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

      <AdminHeader email={session.user?.email} isSuperAdmin={isSuperAdmin} />

      {/* MAIN */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* =====================================================
            TITULO Y BOTONES
        ===================================================== */}

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

          <div className="min-w-0">
            {carpetaActual && (
              <Link
                href={baseUrl}
                className="mb-1 inline-block text-sm font-semibold text-gray-500 transition hover:text-white"
              >
                ← Todas las ligas
              </Link>
            )}

            <h2 className="truncate text-2xl font-black text-white">
              {carpetaActual
                ? `📁 ${carpetaActual.name}`
                : verArchivados
                  ? "Torneos archivados"
                  : isSuperAdmin
                    ? "Todos los torneos"
                    : "Mis ligas"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {torneos.length}{" "}
              {verArchivados
                ? "torneos archivados"
                : carpetaActual
                  ? "torneos en esta carpeta"
                  : "torneos sin carpeta"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            {/* Dentro de una carpeta: renombrar / eliminar */}
            {carpetaActual && isSuperAdmin && (
              <CarpetaAcciones id={carpetaActual.id} nombre={carpetaActual.name} />
            )}

            {/* Activos | Archivados */}
            {!carpetaActual && (
              <div className="flex rounded-xl border border-gray-800 bg-gray-900 p-1 text-sm font-semibold">
                <Link
                  href="/admin"
                  className={`rounded-lg px-3 py-1.5 transition ${
                    !verArchivados ? "bg-gray-800 text-white" : "text-gray-500 hover:text-white"
                  }`}
                >
                  Activos
                </Link>
                <Link
                  href="/admin?archivados=true"
                  className={`rounded-lg px-3 py-1.5 transition ${
                    verArchivados ? "bg-gray-800 text-white" : "text-gray-500 hover:text-white"
                  }`}
                >
                  Archivados
                </Link>
              </div>
            )}

            {!verArchivados && !carpetaActual && isSuperAdmin && (
              <>
                <Link
                  href={organizationId ? `/admin/carpetas/nueva?organizationId=${organizationId}` : "/admin/carpetas/nueva"}
                  className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm font-bold text-white transition hover:border-gray-600"
                >
                  Nueva carpeta
                </Link>
                <Link
                  href="/admin/torneos/nuevo"
                  className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-700"
                >
                  + Nuevo torneo
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