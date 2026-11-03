import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminHeader from "../AdminHeader";
import ArmadoClient from "./ArmadoClient";

export default async function ArmadoPage({ searchParams }: { searchParams: Promise<{ org?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const isSuperAdmin = !!(session.user as any).isSuperAdmin;

  // Organizaciones donde el usuario administra al menos una liga
  const organizaciones = await prisma.organization.findMany({
    where: isSuperAdmin
      ? {}
      : { tenants: { some: { archived: false, users: { some: { userId: session.user.id, role: "ADMIN" } } } } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

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
          No hay organizaciones. Asigna las ligas a una organización para armar el rol.
        </main>
      )}
    </div>
  );
}
