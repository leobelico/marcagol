"use client";

import { useState } from "react";

const PREGUNTAS = [
  "¿Qué tan puntual fue el árbitro y qué tan preparado se presentó para iniciar el partido?",
  "¿Qué tan correcta y consistente consideras que fue la aplicación del reglamento durante el encuentro?",
  "¿Qué tan bien mantuvo el control del partido, incluyendo jugadores, bancas y situaciones de conflicto?",
  "¿Cómo calificas su trato, comunicación y respeto hacia jugadores, entrenadores y capitanes?",
  "Considerando todo su desempeño, ¿qué calificación general le das al trabajo del árbitro en este partido?",
];

const OPCIONES = [
  { v: 1, label: "Muy deficiente" },
  { v: 2, label: "Deficiente" },
  { v: 3, label: "Regular" },
  { v: 4, label: "Bueno" },
  { v: 5, label: "Excelente" },
];

export default function EncuestaForm({
  matchId,
  fecha,
  equipos,
}: {
  matchId: string;
  fecha: string;
  equipos: { id: string; name: string }[];
}) {
  const [teamId, setTeamId] = useState("");
  const [arbitro, setArbitro] = useState("");
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [comentarios, setComentarios] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);

  async function enviar() {
    setError("");
    if (!teamId) return setError("Selecciona tu equipo");
    if (PREGUNTAS.some((_, i) => !respuestas[`q${i + 1}`])) {
      return setError("Responde todas las preguntas");
    }
    setEnviando(true);
    try {
      const res = await fetch(`/api/encuesta/${matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, arbitro, respuestas, comentarios }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error || "Error al enviar");
      else setListo(true);
    } catch {
      setError("Error de conexión, intenta de nuevo");
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="text-5xl">✅</div>
          <h1 className="text-2xl font-black">¡Gracias por tu evaluación!</h1>
          <p className="text-gray-400 text-sm">Tus respuestas fueron registradas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-black">TERRITORIO RINOS</h1>
          <h2 className="text-green-400 font-bold">ENCUESTA DE EVALUACIÓN ARBITRAL</h2>
          <p className="text-gray-500 text-xs mt-1 capitalize">{fecha}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">
              Tu equipo
            </label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
            >
              <option value="">Selecciona tu equipo</option>
              {equipos.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">
              Árbitro (opcional)
            </label>
            <input
              type="text"
              value={arbitro}
              onChange={(e) => setArbitro(e.target.value)}
              placeholder="Nombre del árbitro"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
            />
          </div>
        </div>

        <p className="text-gray-400 text-sm">
          Marca una sola opción en cada pregunta. 1 = Muy deficiente y 5 = Excelente.
        </p>

        {PREGUNTAS.map((p, i) => {
          const key = `q${i + 1}`;
          return (
            <div key={key} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
              <p className="font-semibold text-sm">{i + 1}. {p}</p>
              <div className="grid grid-cols-5 gap-2">
                {OPCIONES.map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setRespuestas((prev) => ({ ...prev, [key]: o.v }))}
                    className={`rounded-xl py-2 px-1 border text-center transition ${
                      respuestas[key] === o.v
                        ? "bg-green-600 border-green-600 text-white"
                        : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    <span className="block font-black text-lg">{o.v}</span>
                    <span className="block text-[10px] leading-tight">{o.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-2">
          <label className="text-xs text-gray-400 uppercase tracking-widest block">
            Comentarios adicionales
          </label>
          <textarea
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            rows={4}
            maxLength={1000}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
          />
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={enviar}
          disabled={enviando}
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
        >
          {enviando ? "Enviando..." : "Enviar evaluación"}
        </button>
      </div>
    </div>
  );
}