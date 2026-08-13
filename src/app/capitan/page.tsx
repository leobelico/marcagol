import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function CapitanPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const tenantUser = await prisma.tenantUser.findFirst({
    where: {
      userId: session.user.id,
      role: "CAPTAIN",
    },
    include: {
      team: true,
      tenant: true,
    },
  });

  if (!tenantUser) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-black">
        ⚽ Panel del Capitán
      </h1>

      <p className="text-gray-400 mt-2">
        {session.user.email}
      </p>

      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <p className="text-gray-400 text-sm">Equipo</p>
        <h2 className="text-2xl font-bold mt-1">
          {tenantUser.team?.name ?? "Sin equipo"}
        </h2>

        <p className="text-gray-400 text-sm mt-4">Liga</p>
        <p className="font-bold">
          {tenantUser.tenant?.name ?? "Sin liga"}
        </p>
      </div>
    </div>
  );
}