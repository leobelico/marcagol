import { getTenant } from "@/lib/tenant";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenant();
  if (!tenant) {
  console.log("TENANT NOT FOUND - slug buscado desde header");
  notFound();
}

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-black text-white text-lg">
            ⚽ {tenant.name}
          </Link>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition">Inicio</Link>
            <Link href="/goleadores" className="hover:text-white transition">Goleadores</Link>
            <Link href="/calendario" className="hover:text-white transition">Calendario</Link>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}