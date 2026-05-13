import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import LandingEditClient from "./LandingEditClient";

export default async function LandingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const torneo = await prisma.tenant.findUnique({ where: { id } });
  if (!torneo) notFound();

  // Serializar fechas para el Client Component
  const torneoSerialized = {
    ...torneo,
    startDate: torneo.startDate?.toISOString() ?? null,
    endDate: torneo.endDate?.toISOString() ?? null,
    createdAt: torneo.createdAt.toISOString(),
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/admin/torneos/${id}`} className="text-gray-500 hover:text-white transition text-sm">← {torneo.name}</Link>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Admin</p>
            <h1 className="text-lg font-black text-white">Landing / Flyer</h1>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <LandingEditClient torneo={torneoSerialized} />
      </main>
    </div>
  );
}