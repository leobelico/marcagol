"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

type Row = {
  torneo_nombre: string;
  torneo_slug: string;
  equipo_nombre: string;
  jugador_nombre: string;
  jugador_numero?: number;
  jugador_posicion?: string;
};

export default function ImportForm() {
  const [preview, setPreview] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok?: string; error?: string } | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const wb = XLSX.read(data, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Row>(ws);
      setPreview(rows);
      setResult(null);
    };
    reader.readAsBinaryString(file);
  }

  async function handleImport() {
    if (!preview.length) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preview),
      });
      const data = await res.json();
      if (res.ok) setResult({ ok: data.message });
      else setResult({ error: data.error });
    } catch {
      setResult({ error: "Error al importar" });
    } finally {
      setLoading(false);
    }
  }

  function descargarPlantilla() {
    const datos = [
      {
        torneo_nombre: "Liga Rinos",
        torneo_slug: "liga-rinos",
        equipo_nombre: "Tigres FC",
        jugador_nombre: "Carlos Méndez",
        jugador_numero: 9,
        jugador_posicion: "Delantero",
      },
      {
        torneo_nombre: "Liga Rinos",
        torneo_slug: "liga-rinos",
        equipo_nombre: "Tigres FC",
        jugador_nombre: "Luis Garza",
        jugador_numero: 10,
        jugador_posicion: "Mediocampista",
      },
      {
        torneo_nombre: "Liga Rinos",
        torneo_slug: "liga-rinos",
        equipo_nombre: "Rayados United",
        jugador_nombre: "Miguel Torres",
        jugador_numero: 11,
        jugador_posicion: "Delantero",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Torneos");
    XLSX.writeFile(wb, "plantilla_marcagol.xlsx");
  }

  return (
    <div className="space-y-8">
      {/* Instrucciones */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <h2 className="font-black text-lg">Instrucciones</h2>
        <p className="text-gray-400 text-sm">
          Descarga la plantilla, llénala con tus datos y súbela aquí. Cada fila representa un jugador.
          Si un torneo o equipo ya existe con el mismo slug/nombre, se reutilizará sin duplicar.
        </p>
        <button
          onClick={descargarPlantilla}
          className="bg-blue-700 hover:bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm"
        >
          📄 Descargar plantilla Excel
        </button>
      </div>

      {/* Upload */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <h2 className="font-black text-lg">Subir archivo</h2>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFile}
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-green-700 file:text-white file:font-bold hover:file:bg-green-600 cursor-pointer"
        />
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-lg">Vista previa — {preview.length} filas</h2>
            <button
              onClick={handleImport}
              disabled={loading}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition text-sm"
            >
              {loading ? "Importando..." : "⬆️ Importar todo"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="pb-2 pr-4">Torneo</th>
                  <th className="pb-2 pr-4">Slug</th>
                  <th className="pb-2 pr-4">Equipo</th>
                  <th className="pb-2 pr-4">Jugador</th>
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2">Posición</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-b border-gray-800/50 text-gray-300">
                    <td className="py-2 pr-4">{row.torneo_nombre}</td>
                    <td className="py-2 pr-4 text-gray-500">{row.torneo_slug}</td>
                    <td className="py-2 pr-4">{row.equipo_nombre}</td>
                    <td className="py-2 pr-4">{row.jugador_nombre}</td>
                    <td className="py-2 pr-4">{row.jugador_numero}</td>
                    <td className="py-2">{row.jugador_posicion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 20 && (
              <p className="text-gray-600 text-xs mt-2">... y {preview.length - 20} filas más</p>
            )}
          </div>
        </div>
      )}

      {/* Resultado */}
      {result?.ok && (
        <div className="bg-green-900/30 border border-green-700 rounded-2xl p-4 text-green-400 font-bold">
          ✅ {result.ok}
        </div>
      )}
      {result?.error && (
        <div className="bg-red-900/30 border border-red-700 rounded-2xl p-4 text-red-400 font-bold">
          ❌ {result.error}
        </div>
      )}
    </div>
  );
}