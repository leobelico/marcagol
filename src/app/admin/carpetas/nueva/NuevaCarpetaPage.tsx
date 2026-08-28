"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function NuevaCarpetaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const organizationId = searchParams.get("organizationId");

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("El nombre de la carpeta es obligatorio");
      return;
    }

    if (!organizationId) {
      setError("No se encontró la organización");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/carpetas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          organizationId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "No se pudo crear la carpeta"
        );
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      console.error("ERROR CREANDO CARPETA:", err);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo crear la carpeta"
      );
    } finally {
      setLoading(false);
    }
  };

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
            className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition"
          >
            ← Volver
          </Link>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          {/* TITULO */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-xl bg-blue-900/40 flex items-center justify-center text-3xl">
              📁
            </div>

            <div>
              <h2 className="text-2xl font-black">
                Crear carpeta
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Agrupa tus ligas para encontrarlas más fácilmente.
              </p>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-5 bg-red-900/30 border border-red-800 text-red-400 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* FORMULARIO */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-bold text-gray-300 mb-2"
              >
                Nombre de la carpeta
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Ligas 2026"
                disabled={loading}
                autoFocus
                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-green-500 transition disabled:opacity-50"
              />
            </div>

            {/* ORGANIZACIÓN */}
            <div className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Organización
              </p>

              <p className="text-white font-bold mt-1">
                Organización seleccionada
              </p>

              <p className="text-xs text-gray-600 mt-1 break-all">
                ID: {organizationId || "No especificada"}
              </p>
            </div>

            {/* BOTONES */}
            <div className="flex justify-end gap-3 pt-2">
              <Link
                href="/admin"
                className="px-5 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-bold transition"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creando..." : "📁 Crear carpeta"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

