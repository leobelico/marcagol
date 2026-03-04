import type { Metadata } from "next";
import { getTenant } from "@/lib/tenant";
import { notFound } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Torneo de Fútbol",
};

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getTenant();
  if (!tenant) notFound();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logo && (
              <img src={tenant.logo} className="w-10 h-10 rounded-full" />
            )}
            <span className="text-xl font-bold text-white">{tenant.name}</span>
          </div>
          <nav className="flex gap-6 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition">Posiciones</Link>
            <Link href="/goleadores" className="hover:text-white transition">Goleadores</Link>
            <Link href="/calendario" className="hover:text-white transition">Calendario</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}