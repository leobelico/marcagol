import { headers } from "next/headers";
import { prisma } from "./prisma";

export async function getTenant() {
  const headersList = await headers();

  let slug = headersList.get("x-tenant-slug");

  if (!slug) {
    const host = headersList.get("host") || "";
    const hostname = host.split(":")[0];
    const parts = hostname.split(".");
    if (parts.length >= 2 && parts[0] !== "localhost" && parts[0] !== "www") {
      slug = parts[0];
    }
  }

  // Fallback para desarrollo local
  if (!slug && process.env.NODE_ENV === "development") {
    slug = process.env.DEV_TENANT_SLUG || null;
  }

  if (!slug) return null;

  return await prisma.tenant.findUnique({
    where: { slug },
  });
}