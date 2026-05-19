import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get("host") || "";
  const host = hostname.split(":")[0];
  const parts = host.split(".");

  const appDomain = (process.env.NEXT_PUBLIC_APP_DOMAIN || "").replace(/:\d+$/, "");

  // Localhost: liga-rinos.localhost
  const isLocalhost = parts.length === 2 && parts[1] === "localhost";
  // lvh.me: liga-rinos.lvh.me
  const isLvh = parts.length === 3 && parts[1] === "lvh" && parts[2] === "me";
  // Producción: liga-rinos.marcagol.site
  const isProduction = appDomain && host.endsWith(`.${appDomain}`) && host !== appDomain;

  if (isLocalhost || isLvh || isProduction) {
    const slug = parts[0];
    const res = NextResponse.next();
    res.headers.set("x-tenant-slug", slug);
    return res;
  }

  // Proteger rutas /admin
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const session = await auth();
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};