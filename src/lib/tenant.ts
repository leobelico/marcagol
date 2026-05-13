import { headers } from "next/headers";
import { prisma } from "./prisma";

export async function getTenant() {
  const headersList = await headers();

  // Intentar desde header del middleware
  let slug = headersList.get("x-tenant-slug");

  // Fallback: leer directamente del host
  if (!slug) {
    const host = (headersList.get("host") || "").split(":")[0];
    const parts = host.split(".");

    const isLocalhost = parts.length === 2 && parts[1] === "localhost";
    const isLvh = parts.length === 3 && parts[1] === "lvh" && parts[2] === "me";

    if (isLocalhost || isLvh) {
      slug = parts[0];
    }
  }

  // Fallback para desarrollo local
  if (!slug && process.env.NODE_ENV === "development") {
    slug = process.env.DEV_TENANT_SLUG || null;
  }

  console.log("SLUG FINAL:", slug);
  if (!slug) return null;

  return await prisma.tenant.findUnique({
    where: { slug },
  });
}