"use server";

// Guarda los datos de contacto de una liga (organización): quién la
// organiza y sus redes. Se muestran en la app a jugadores y aficionados.
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function limpio(v: FormDataEntryValue | null, max = 200) {
  const s = typeof v === "string" ? v.trim().slice(0, max) : "";
  return s || null;
}

export async function guardarContactoLiga(formData: FormData) {
  const session = await auth();
  const user = session?.user as { isSuperAdmin?: boolean; organizationId?: string } | undefined;
  const id = limpio(formData.get("id"));
  if (!user || !id) throw new Error("No autorizado");
  // Super admin edita cualquiera; un admin de organización, solo la suya
  if (!user.isSuperAdmin && user.organizationId !== id) throw new Error("No autorizado");

  await prisma.organization.update({
    where: { id },
    data: {
      contactName: limpio(formData.get("contactName"), 80),
      instagram: limpio(formData.get("instagram")),
      facebook: limpio(formData.get("facebook")),
      whatsapp: limpio(formData.get("whatsapp"), 30),
    },
  });
  revalidatePath("/admin/ligas");
}
