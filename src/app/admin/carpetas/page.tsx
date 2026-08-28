
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function NuevaCarpetaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isSuperAdmin = (session.user as any).isSuperAdmin;

  // Por ahora solo SUPER_ADMIN puede crear carpetas
  if (!isSuperAdmin) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* HEADER */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">
              Panel de Control
            </p>

            <h1 className="text-lg font-black">
              Nueva carpeta
            </h1>
          </div>

          <Link
            href="/admin"
            className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg"
          >
            ← Volver
          </Link>
        </div>
      </header>

      {/* FORMULARIO */}
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-black">
              Crear carpeta
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Organiza tus ligas y torneos en carpetas.
            </p>
          </div>

          <form
            action="/api/admin/carpetas/nueva"
            method="POST"
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-bold text-gray-300 mb-2"
              >
                Nombre de la carpeta
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Ej. Ligas 2026"
                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link
                href="/admin"
                className="px-5 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-bold"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-sm font-bold"
              >
                📁 Crear carpeta
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
