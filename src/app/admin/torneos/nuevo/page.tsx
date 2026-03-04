"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DIAS = [
  { value: "MONDAY", label: "Lunes" },
  { value: "TUESDAY", label: "Martes" },
  { value: "WEDNESDAY", label: "Miércoles" },
  { value: "THURSDAY", label: "Jueves" },
  { value: "FRIDAY", label: "Viernes" },
  { value: "SATURDAY", label: "Sábado" },
  { value: "SUNDAY", label: "Domingo" },
];

export default function NuevoTorneoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);

  function toggleDia(dia: string) {
    setDiasSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);

    const data = {
      name: form.get("name"),
      slug: form.get("slug"),
      startDate: form.get("startDate"),
      matchesPerDay: Number(form.get("matchesPerDay")),
      matchDuration: Number(form.get("matchDuration")),
      roundTrip: form.get("roundTrip") === "true",
      matchDays: diasSeleccionados,
    };

    if (diasSeleccionados.length === 0) {
      setError("Selecciona al menos un día de juego");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/admin/torneos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "Error al crear el torneo");
      setLoading(false);
      return;
    }

    router.push(`/admin/torneos/${json.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-gray-500 hover:text-white transition text-sm">← Volver</Link>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Admin</p>
            <h1 className="text-lg font-black text-white">Nuevo Torneo</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Info básica */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Información General</h2>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Nombre del Torneo
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="Liga Regia 2026"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition"
                onChange={(e) => {
                  const slugInput = document.querySelector<HTMLInputElement>('input[name="slug"]');
                  if (slugInput) {
                    slugInput.value = e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .replace(/[^a-z0-9-]/g, "");
                  }
                }}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Subdominio (slug)
              </label>
              <div className="flex items-center gap-2">
                <input
                  name="slug"
                  type="text"
                  required
                  placeholder="liga-regia"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition"
                />
                <span className="text-gray-500 text-sm">.tuapp.com</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Solo letras minúsculas, números y guiones</p>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Fecha de Inicio
              </label>
              <input
                name="startDate"
                type="date"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition"
              />
            </div>
          </div>

          {/* Configuración de partidos */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Configuración de Partidos</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Partidos por día
                </label>
                <input
                  name="matchesPerDay"
                  type="number"
                  min={1}
                  max={10}
                  defaultValue={2}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Duración (minutos)
                </label>
                <input
                  name="matchDuration"
                  type="number"
                  min={30}
                  max={120}
                  defaultValue={90}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">
                Días de juego
              </label>
              <div className="flex flex-wrap gap-2">
                {DIAS.map((dia) => (
                  <button
                    key={dia.value}
                    type="button"
                    onClick={() => toggleDia(dia.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                      diasSeleccionados.includes(dia.value)
                        ? "bg-green-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    {dia.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">
                Formato del torneo
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 cursor-pointer flex-1 hover:border-gray-600 transition">
                  <input type="radio" name="roundTrip" value="false" defaultChecked className="accent-green-500" />
                  <div>
                    <p className="text-white font-medium text-sm">Solo ida</p>
                    <p className="text-gray-500 text-xs">Cada par de equipos juega una vez</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 cursor-pointer flex-1 hover:border-gray-600 transition">
                  <input type="radio" name="roundTrip" value="true" className="accent-green-500" />
                  <div>
                    <p className="text-white font-medium text-sm">Ida y vuelta</p>
                    <p className="text-gray-500 text-xs">Cada par juega como local y visitante</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-4 rounded-xl transition text-base"
          >
            {loading ? "Creando torneo..." : "Crear Torneo →"}
          </button>

        </form>
      </main>
    </div>
  );
}