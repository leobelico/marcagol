import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NuevaCarpetaPage from "./NuevaCarpetaPage";

// Crear carpeta (solo SUPER_ADMIN). Las organizaciones se cargan aquí
// para que se pueda elegir a cuál pertenece la carpeta.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!(session.user as any).isSuperAdmin) redirect("/admin");

  const organizaciones = await prisma.organization.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const { organizationId } = await searchParams;
  const inicial =
    organizaciones.find((o) => o.id === organizationId)?.id ?? organizaciones[0]?.id ?? "";

  return <NuevaCarpetaPage organizaciones={organizaciones} inicial={inicial} />;
}
