import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import EquiposClient from "./EquiposClient";

export default async function EquiposPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const role = (session.user as any).role;
  const teamId = (session.user as any).teamId;
  const tenantId = (session.user as any).tenantId;
  const isSuperAdmin = (session.user as any).isSuperAdmin;

  // ─────────────────────────────────────
  // CAPITÁN: solo puede entrar a su torneo
  // ─────────────────────────────────────
  if (
    role === "CAPTAIN" &&
    tenantId !== id
  ) {
    redirect("/admin");
  }

  const torneo = await prisma.tenant.findUnique({
    where: {
      id,
    },

    include: {
      teams: {
        where:
          role === "CAPTAIN"
            ? {
                id: teamId,
              }
            : undefined,

        include: {
          players: {
            include: {
              stats: true,
            },
          },

          _count: {
            select: {
              players: true,
            },
          },
        },

        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!torneo) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">

          <Link
            href={`/admin/torneos/${id}`}
            className="text-gray-500 hover:text-white transition text-sm"
          >
            ← {torneo.name}
          </Link>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">
              {role === "CAPTAIN" ? "Capitán" : "Admin"}
            </p>

            <h1 className="text-lg font-black text-white">
              Equipos
            </h1>
          </div>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <EquiposClient torneo={torneo} />
      </main>

    </div>
  );
}