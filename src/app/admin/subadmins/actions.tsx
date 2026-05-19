"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

async function requireSuperAdmin() {
  const session = await auth();
  if (!(session?.user as any)?.isSuperAdmin) throw new Error("No autorizado");
  return session!;
}

export async function createSubAdmin(formData: FormData) {
  await requireSuperAdmin();

  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;
  const tenantId = formData.get("tenantId") as string;

  if (!email || !name || !password || !tenantId) throw new Error("Faltan campos");

  const hashed = await bcrypt.hash(password, 10);

  // Crear usuario si no existe
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, password: hashed, isSuperAdmin: false },
  });

  // Asignar como ADMIN al tenant
  await prisma.tenantUser.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId } },
    update: { role: "ADMIN" },
    create: { userId: user.id, tenantId, role: "ADMIN" },
  });

  revalidatePath("/admin/subadmins");
}

export async function deleteSubAdmin(userId: string, tenantId: string) {
  await requireSuperAdmin();

  await prisma.tenantUser.deleteMany({
    where: { userId, tenantId },
  });

  revalidatePath("/admin/subadmins");
}