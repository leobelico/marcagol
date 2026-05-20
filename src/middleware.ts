import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get("host") || "";
  const host = hostname.split(":")[0];
  const parts = host.split(".");

  const appDomain = (process.env.NEXT_PUBLIC_APP_DOMAIN || "").replace(/:\d+$/, "");

  const isLocalhost = parts.length === 2 && parts[1] === "localhost";
  const isLvh = parts.length === 3 && parts[1] === "lvh" && parts[2] === "me";
  const isProduction = appDomain && host.endsWith(`.${appDomain}`) && host !== appDomain;

  if (isLocalhost || isLvh || isProduction) {
    const slug = parts[0];
    const url = req.nextUrl.clone();
    url.pathname = `/sitio${url.pathname === "/" ? "" : url.pathname}`;
    const res = NextResponse.rewrite(url);
    res.headers.set("x-tenant-slug", slug);
    return res;
  }

  // Proteger rutas /admin con getToken (liviano, no importa Prisma)
  if (req.nextUrl.pathname.startsWith("/admin")) {
const token = await getToken({ 
      req, 
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
      cookieName: process.env.NODE_ENV === "production" 
        ? "__Secure-authjs.session-token" 
        : "authjs.session-token",
    });
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};