import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import CapitanClient from "./CapitanClient";

export default async function CapitanPage({
  searchParams,
}: {
  searchParams: Promise<{ liga?: string; equipo?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { liga: ligaSeleccionadaId, equipo: equipoSeleccionadoId } =
    await searchParams;

  const memberships = ((session.user as any).memberships || []) as {
    tenantId: string;
    tenantName: string;
    role: string;
    teamIds: string[];
  }[];

  // Solo ligas donde es capitán y tiene al menos un equipo
  const ligasCapitan = memberships.filter(
    (m) => m.role === "CAPTAIN" && m.teamIds.length > 0
  );

  if (ligasCapitan.length === 0) {
    redirect("/login");
  }

  // Elegir liga: la de ?liga=, o la primera de la lista
  const ligaActiva =
    ligasCapitan.find((m) => m.tenantId === ligaSeleccionadaId) ??
    ligasCapitan[0];

  const tenantUser = await prisma.tenantUser.findFirst({
    where: {
      userId: session.user.id,
      tenantId: ligaActiva.tenantId,
      role: "CAPTAIN",
    },
    include: {
      teams: {
        include: {
          team: {
            include: {
              players: {
                orderBy: {
                  name: "asc",
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      tenant: true,
    },
  });

  if (!tenantUser || !tenantUser.tenant || tenantUser.teams.length === 0) {
    redirect("/login");
  }

  const equipos = tenantUser.teams.map((tc) => tc.team);

  const equipoActivo =
    equipos.find((t) => t.id === equipoSeleccionadoId) ?? equipos[0];

  return (
    <div className="min-h-screen bg-gray-950">
      {(ligasCapitan.length > 1 || equipos.length > 1) && (
        <div className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-5xl mx-auto px-4 py-4 space-y-3">
            {/* Selector de liga (solo si tiene más de una) */}
            {ligasCapitan.length > 1 && (
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-1">
                  🏆 Tus ligas
                </p>
                <div className="flex flex-wrap gap-2">
                  {ligasCapitan.map((m) => (
                    <Link
                      key={m.tenantId}
                      href={`/capitan?liga=${m.tenantId}`}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                        m.tenantId === ligaActiva.tenantId
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                          : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                      }`}
                    >
                      {m.tenantName}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de equipo dentro de la liga activa (solo si tiene más de uno) */}
            {equipos.length > 1 && (
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-1">
                  ⚽ Tus equipos en {ligaActiva.tenantName}
                </p>
                <div className="flex flex-wrap gap-2">
                  {equipos.map((t) => (
                    <Link
                      key={t.id}
                      href={`/capitan?liga=${ligaActiva.tenantId}&equipo=${t.id}`}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                        t.id === equipoActivo.id
                          ? "bg-green-600 text-white shadow-lg shadow-green-900/30"
                          : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                      }`}
                    >
                      {t.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <CapitanClient
        team={equipoActivo}
        tenant={tenantUser.tenant}
        email={session.user.email ?? null}
      />
    </div>
  );
}
