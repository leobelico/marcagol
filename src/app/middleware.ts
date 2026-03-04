import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get("host") || "";
  const host = hostname.split(":")[0];
  const parts = host.split(".");

  // Detectar tenant por subdominio
  const isSubdomain = parts.length >= 2 && parts[0] !== "localhost" && parts[0] !== "www";
  if (isSubdomain) {
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