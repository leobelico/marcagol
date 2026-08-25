import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import CapitanClient from "./CapitanClient";

export default async function CapitanPage({
  searchParams,
}: {
  searchParams: Promise<{ equipo?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { equipo: equipoSeleccionadoId } = await searchParams;

  const tenantUser = await prisma.tenantUser.findFirst({
    where: {
      userId: session.user.id,
      role: "CAPTAIN",
    },
    include: {
      // Ahora un TenantUser puede tener varios equipos (N a N)
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

  // Elegir cuál equipo mostrar: el que venga en ?equipo=, o el primero
  const equipoActivo =
    equipos.find((t) => t.id === equipoSeleccionadoId) ?? equipos[0];

  return (
    <div>
      {equipos.length > 1 && (
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <div className="flex flex-wrap gap-2 bg-gray-900 border border-gray-800 rounded-xl p-1.5 w-fit">
            {equipos.map((t) => (
              <Link
                key={t.id}
                href={`/capitan?equipo=${t.id}`}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                  t.id === equipoActivo.id
                    ? "bg-green-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {t.name}
              </Link>
            ))}
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