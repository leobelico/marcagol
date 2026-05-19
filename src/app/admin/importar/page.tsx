import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ImportForm from "./ImportForm";

export default async function ImportarPage() {
  const session = await auth();
  if (!(session?.user as any)?.isSuperAdmin) redirect("/admin");

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Panel de Control</p>
            <h1 className="text-lg font-black text-white">📥 Importar desde Excel / CSV</h1>
          </div>
          <Link href="/admin" className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition">
            ← Volver
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <ImportForm />
      </main>
    </div>
  );
}