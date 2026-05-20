import { headers } from "next/headers";
import { prisma } from "./prisma";

export async function getTenant() {
  const headersList = await headers();

  let slug = headersList.get("x-tenant-slug");
  console.log("HEADER x-tenant-slug:", slug);

  if (!slug) {
    const host = (headersList.get("host") || "").split(":")[0];
    const parts = host.split(".");
    console.log("HOST:", host, "PARTS:", parts);

    const isLocalhost = parts.length === 2 && parts[1] === "localhost";
    const isLvh = parts.length === 3 && parts[1] === "lvh" && parts[2] === "me";
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN?.replace(/:\d+$/, "") || "";
    const isProduction = appDomain && host.endsWith(`.${appDomain}`) && host !== appDomain;

    if (isLocalhost || isLvh) {
      slug = parts[0];
    } else if (isProduction) {
      slug = host.replace(`.${appDomain}`, "");
    }
  }

  console.log("SLUG FINAL:", slug);
  if (!slug) return null;

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  console.log("TENANT ENCONTRADO:", tenant?.name ?? "NO ENCONTRADO");
  return tenant;
}