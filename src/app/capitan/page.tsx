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
          players: true,
        },
      },
      tenant: true,
    },
  });

  if (!tenantUser?.team) {
    redirect("/login");
  }

  return (
    <CapitanClient
      team={tenantUser.team}
      tenantName={tenantUser.tenant.name}
    />
  );
}