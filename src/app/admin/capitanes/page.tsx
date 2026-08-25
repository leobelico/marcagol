import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function CapitanesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isSuperAdmin = (session.user as any).isSuperAdmin;

  if (!isSuperAdmin) {
    redirect("/admin");
  }

  // --------------------------------------------------
  // TRAER TODOS LOS USUARIOS QUE SON CAPITÁN EN ALGÚN
  // TORNEO, CON SUS EQUIPOS AGRUPADOS POR TORNEO
  // --------------------------------------------------

  const usuarios = await prisma.user.findMany({
    where: {
      tenants: {
        some: {
          teams: {
            some: {},
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      tenants: {
        select: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          teams: {
            select: {
              team: {
                select: {
                  id: true,
                  name: true,
                  logo: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const totalEquipos = usuarios.reduce(
    (acc, u) =>
      acc +
      u.tenants.reduce((a2, tu) => a2 + tu.teams.length, 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/admin"
            className="text-gray-500 hover:text-white transition text-sm"
          >
            ← Volver
          </Link>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">
              Admin
            </p>
            <h1 className="text-lg font-black text-white">
              👤 Capitanes
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-black text-white">
            Todos los capitanes
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {usuarios.length} capitanes · {totalEquipos} equipos en total
          </p>
        </div>

        {usuarios.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl">
            <p className="text-4xl mb-4">👤</p>
            <p className="text-gray-400 font-medium">
              No hay capitanes registrados aún
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {usuarios.map((u) => {
              const totalEquiposUsuario = u.tenants.reduce(
                (acc, tu) => acc + tu.teams.length,
                0
              );

              return (
                <div
                  key={u.id}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                    <div>
                      <h3 className="text-white font-bold text-lg">
                        {u.name || "Sin nombre"}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                        {u.phone && <span>📱 {u.phone}</span>}
                        {u.email && <span>✉️ {u.email}</span>}
                      </div>
                    </div>

                    <span className="text-xs bg-green-900/30 text-green-400 px-3 py-1.5 rounded-full font-bold self-start">
                      {totalEquiposUsuario}{" "}
                      {totalEquiposUsuario === 1 ? "equipo" : "equipos"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {u.tenants
                      .filter((tu) => tu.teams.length > 0)
                      .map((tu) => (
                        <div
                          key={tu.tenant.id}
                          className="bg-gray-800/50 border border-gray-800 rounded-xl p-4"
                        >
                          <Link
                            href={`/admin/torneos/${tu.tenant.id}`}
                            className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-green-400 transition"
                          >
                            {tu.tenant.name}
                          </Link>

                          <div className="flex flex-wrap gap-2 mt-2">
                            {tu.teams.map((tc) => (
                              <div
                                key={tc.team.id}
                                className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5"
                              >
                                <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center flex-shrink-0">
                                  {tc.team.logo ? (
                                    <img
                                      src={tc.team.logo}
                                      alt={tc.team.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-[10px] text-gray-500">
                                      ⚽
                                    </span>
                                  )}
                                </div>
                                <span className="text-white text-xs font-medium">
                                  {tc.team.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}