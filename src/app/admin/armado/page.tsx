import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminHeader from "../AdminHeader";
import ArmadoClient from "./ArmadoClient";
import { SIN_ORG } from "@/lib/armadoRolServer";

export default async function ArmadoPage({ searchParams }: { searchParams: Promise<{ org?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const isSuperAdmin = !!(session.user as any).isSuperAdmin;

  // Grupos de ligas que comparten canchas: cada organización, más las
  // ligas sin organización. Solo los que tienen ligas que administra.
  const ligas = await prisma.tenant.groupBy({
    by: ["organizationId"],
    where: {
      archived: false,
      ...(isSuperAdmin ? {} : { users: { some: { userId: session.user.id, role: "ADMIN" } } }),
    },
    _count: true,
  });
  const nombres = await prisma.organization.findMany({
    where: { id: { in: ligas.map((l) => l.organizationId).filter((id): id is string => !!id) } },
    select: { id: true, name: true },
  });
  const organizaciones = ligas
    .sort((a, b) => b._count - a._count)
    .map((l) => ({
      id: l.organizationId ?? SIN_ORG,
      name: l.organizationId
        ? `${nombres.find((o) => o.id === l.organizationId)?.name ?? "Organización"} (${l._count} ligas)`
        : `Ligas sin organización (${l._count})`,
    }));

  if (!isSuperAdmin && organizaciones.length === 0) redirect("/admin");

  const { org } = await searchParams;
  const activa = organizaciones.find((o) => o.id === org) ?? organizaciones[0] ?? null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AdminHeader email={session.user.email} isSuperAdmin={isSuperAdmin} activa="/admin/armado" />
      {activa ? (
        <ArmadoClient organizaciones={organizaciones} org={activa} />
      ) : (
        <main className="mx-auto max-w-6xl px-4 py-16 text-center text-gray-400">
          No hay ligas activas.
        </main>
      )}
    </div>
  );
}
