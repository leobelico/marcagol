import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CapitanClient from "./CapitanClient";

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
      team: {
        include: {
          players: {
            orderBy: {
              name: "asc",
            },
          },
        },
      },
      tenant: true,
    },
  });

  if (!tenantUser || !tenantUser.team || !tenantUser.tenant) {
    redirect("/login");
  }

  return (
    <CapitanClient
      team={tenantUser.team}
      tenant={tenantUser.tenant}
      email={session.user.email ?? null}
    />
  );
}