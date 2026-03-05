import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import FinanzasClient from "./FinanzasClient";

export default async function FinanzasPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const torneo = await prisma.tenant.findUnique({
    where: { id },
    include: {
      teams: { orderBy: { name: "asc" } },
      finances: {
        include: { team: true },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!torneo) notFound();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/admin/torneos/${id}`} className="text-gray-500 hover:text-white transition text-sm">← {torneo.name}</Link>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Admin</p>
            <h1 className="text-lg font-black text-white">Finanzas</h1>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <FinanzasClient torneo={torneo} />
      </main>
    </div>
  );
}