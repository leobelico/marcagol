"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Player = { id: string; name: string; number: number | null };
type Team = { id: string; name: string; players?: Player[] };
type MatchEvent = { id: string; type: string; minute: number; player: { player: { name: string } } };
type Match = {
  id: string;
  date: Date;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
};
type Round = { id: string; number: number; name: string | null; matches: Match[] };
type Torneo = { id: string; rounds: Round[] };

export default function ResultadosClient({ torneo }: { torneo: Torneo }) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({});
  const [loading, setLoading] = useState(false);

  // Modal de eventos
  const [modalPartido, setModalPartido] = useState<Match | null>(null);
  const [jugadores, setJugadores] = useState<{ homeTeam: Team; awayTeam: Team } | null>(null);
  const [eventos, setEventos] = useState<MatchEvent[]>([]);
  const [nuevoEvento, setNuevoEvento] = useState({ type: "GOAL", minute: "", playerId: "", assistPlayerId: "" });
  const [loadingModal, setLoadingModal] = useState(false);

  function iniciarEdicion(match: Match) {
    setEditando(match.id);
    setScores((prev) => ({
      ...prev,
      [match.id]: {
        home: match.homeScore?.toString() ?? "",
        away: match.awayScore?.toString() ?? "",
      },
    }));
  }

  async function guardarResultado(matchId: string) {
    const score = scores[matchId];
    if (score.home === "" || score.away === "") return;
    setLoading(true);
    await fetch(`/api/admin/partidos/${matchId}/resultado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        homeScore: Number(score.home),
        awayScore: Number(score.away),
        status: "FINISHED",
      }),
    });
    setEditando(null);
    setLoading(false);
    router.refresh();
  }

  async function marcarEnVivo(matchId: string) {
    setLoading(true);
    await fetch(`/api/admin/partidos/${matchId}/resultado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "LIVE" }),
    });
    setLoading(false);
    router.refresh();
  }

  async function cancelarPartido(matchId: string) {
    if (!confirm("¿Cancelar este partido?")) return;
    setLoading(true);
    await fetch(`/api/admin/partidos/${matchId}/resultado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    setLoading(false);
    router.refresh();
  }

  async function abrirEventos(match: Match) {
    setModalPartido(match);
    setLoadingModal(true);
    const [jugRes, evRes] = await Promise.all([
      fetch(`/api/admin/partidos/${match.id}/jugadores`).then(r => r.json()),
      fetch(`/api/admin/partidos/${match.id}/eventos`).then(r => r.json()),
    ]);
    setJugadores(jugRes);
    setEventos(evRes);
    setLoadingModal(false);
  }

  async function agregarEvento() {
    if (!modalPartido || !nuevoEvento.playerId || !nuevoEvento.minute) return;
    setLoadingModal(true);
    await fetch(`/api/admin/partidos/${modalPartido.id}/eventos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoEvento),
    });
    // Recargar eventos
    const evRes = await fetch(`/api/admin/partidos/${modalPartido.id}/eventos`).then(r => r.json());
    setEventos(evRes);
    setNuevoEvento({ type: "GOAL", minute: "", playerId: "", assistPlayerId: "" });
    setLoadingModal(false);
    router.refresh();
  }

  async function eliminarEvento(eventId: string) {
    if (!modalPartido) return;
    setLoadingModal(true);
    await fetch(`/api/admin/partidos/${modalPartido.id}/eventos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    const evRes = await fetch(`/api/admin/partidos/${modalPartido.id}/eventos`).then(r => r.json());
    setEventos(evRes);
    setLoadingModal(false);
    router.refresh();
  }

  const allPlayers = jugadores
    ? [...(jugadores.homeTeam.players ?? []).map(p => ({ ...p, team: jugadores.homeTeam.name })),
       ...(jugadores.awayTeam.players ?? []).map(p => ({ ...p, team: jugadores.awayTeam.name }))]
    : [];

  if (torneo.rounds.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl">
        <p className="text-4xl mb-4">📅</p>
        <p className="text-gray-400 font-medium">No hay calendario generado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">Resultados</h2>
        <p className="text-gray-500 text-sm mt-1">Carga los marcadores y eventos de cada partido</p>
      </div>

      {torneo.rounds.map((round) => (
        <div key={round.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-white font-bold">{round.name ?? `Jornada ${round.number}`}</h3>
            <span className="text-xs text-gray-500">
              {round.matches.filter(m => m.status === "FINISHED").length}/{round.matches.length} jugados
            </span>
          </div>

          <div className="divide-y divide-gray-800">
            {round.matches.map((m) => {
              const isEditing = editando === m.id;
              const score = scores[m.id];

              return (
                <div key={m.id} className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-600 w-16 flex-shrink-0">
                      {new Date(m.date).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                    </span>

                    <div className="flex items-center gap-3 flex-1">
                      <span className={`text-sm font-semibold text-right flex-1 ${m.status === "FINISHED" && (m.homeScore ?? 0) > (m.awayScore ?? 0) ? "text-white" : "text-gray-400"}`}>
                        {m.homeTeam.name}
                      </span>

                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input type="number" min={0} max={99}
                            value={score?.home ?? ""}
                            onChange={(e) => setScores(prev => ({ ...prev, [m.id]: { ...prev[m.id], home: e.target.value } }))}
                            className="w-14 bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-center font-bold focus:outline-none focus:border-green-500"
                          />
                          <span className="text-gray-500 font-bold">-</span>
                          <input type="number" min={0} max={99}
                            value={score?.away ?? ""}
                            onChange={(e) => setScores(prev => ({ ...prev, [m.id]: { ...prev[m.id], away: e.target.value } }))}
                            className="w-14 bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-center font-bold focus:outline-none focus:border-green-500"
                          />
                        </div>
                      ) : (
                        <div className="text-center min-w-[80px]">
                          {m.status === "FINISHED" ? (
                            <span className="bg-gray-800 text-white font-black px-3 py-1 rounded-lg text-sm">
                              {m.homeScore} - {m.awayScore}
                            </span>
                          ) : m.status === "LIVE" ? (
                            <span className="bg-green-900/50 text-green-400 font-black px-3 py-1 rounded-lg text-sm animate-pulse">EN VIVO</span>
                          ) : m.status === "CANCELLED" ? (
                            <span className="text-red-400 text-xs font-bold">CANCELADO</span>
                          ) : (
                            <span className="text-gray-600 text-xs font-bold bg-gray-800 px-3 py-1 rounded-lg">VS</span>
                          )}
                        </div>
                      )}

                      <span className={`text-sm font-semibold flex-1 ${m.status === "FINISHED" && (m.awayScore ?? 0) > (m.homeScore ?? 0) ? "text-white" : "text-gray-400"}`}>
                        {m.awayTeam.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isEditing ? (
                        <>
                          <button onClick={() => guardarResultado(m.id)} disabled={loading}
                            className="text-xs bg-green-600 hover:bg-green-500 text-white font-bold px-3 py-1.5 rounded-lg transition">
                            Guardar
                          </button>
                          <button onClick={() => setEditando(null)}
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-400 font-bold px-3 py-1.5 rounded-lg transition">
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          {m.status === "FINISHED" && (
                            <button onClick={() => abrirEventos(m)}
                              className="text-xs bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-400 font-bold px-3 py-1.5 rounded-lg transition">
                              ⚽ Goles
                            </button>
                          )}
                          {m.status !== "CANCELLED" && (
                            <button onClick={() => iniciarEdicion(m)}
                              className="text-xs bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 font-bold px-3 py-1.5 rounded-lg transition">
                              {m.status === "FINISHED" ? "Editar" : "Cargar resultado"}
                            </button>
                          )}
                          {m.status === "SCHEDULED" && (
                            <button onClick={() => marcarEnVivo(m.id)}
                              className="text-xs bg-green-900/40 hover:bg-green-900/60 text-green-400 font-bold px-3 py-1.5 rounded-lg transition">
                              En vivo
                            </button>
                          )}
                          {m.status !== "FINISHED" && m.status !== "CANCELLED" && (
                            <button onClick={() => cancelarPartido(m.id)}
                              className="text-xs bg-red-900/20 hover:bg-red-900/40 text-red-400 font-bold px-3 py-1.5 rounded-lg transition">
                              Cancelar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Modal de eventos */}
      {modalPartido && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-white font-black">Eventos del Partido</h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  {modalPartido.homeTeam.name} {modalPartido.homeScore} - {modalPartido.awayScore} {modalPartido.awayTeam.name}
                </p>
              </div>
              <button onClick={() => setModalPartido(null)}
                className="text-gray-500 hover:text-white text-xl font-bold transition">✕</button>
            </div>

            <div className="px-6 py-5 space-y-6">

              {/* Agregar evento */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Agregar Evento</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Tipo</label>
                      <select
                        value={nuevoEvento.type}
                        onChange={(e) => setNuevoEvento({ ...nuevoEvento, type: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500">
                        <option value="GOAL">⚽ Gol</option>
                        <option value="SUBSTITUTION">🔄 Asistencia</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Minuto</label>
                      <input
                        type="number" min={1} max={120}
                        placeholder="45"
                        value={nuevoEvento.minute}
                        onChange={(e) => setNuevoEvento({ ...nuevoEvento, minute: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 block mb-1">
                      {nuevoEvento.type === "GOAL" ? "Goleador" : "Jugador"}
                    </label>
                    <select
                      value={nuevoEvento.playerId}
                      onChange={(e) => setNuevoEvento({ ...nuevoEvento, playerId: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500">
                      <option value="">Seleccionar jugador</option>
                      {jugadores && (
                        <>
                          <optgroup label={jugadores.homeTeam.name}>
                            {(jugadores.homeTeam.players ?? []).map(p => (
                              <option key={p.id} value={p.id}>{p.number ? `#${p.number} ` : ""}{p.name}</option>
                            ))}
                          </optgroup>
                          <optgroup label={jugadores.awayTeam.name}>
                            {(jugadores.awayTeam.players ?? []).map(p => (
                              <option key={p.id} value={p.id}>{p.number ? `#${p.number} ` : ""}{p.name}</option>
                            ))}
                          </optgroup>
                        </>
                      )}
                    </select>
                  </div>

                  {nuevoEvento.type === "GOAL" && (
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Asistencia (opcional)</label>
                      <select
                        value={nuevoEvento.assistPlayerId}
                        onChange={(e) => setNuevoEvento({ ...nuevoEvento, assistPlayerId: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500">
                        <option value="">Sin asistencia</option>
                        {allPlayers.filter(p => p.id !== nuevoEvento.playerId).map(p => (
                          <option key={p.id} value={p.id}>{p.number ? `#${p.number} ` : ""}{p.name} ({p.team})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button onClick={agregarEvento} disabled={loadingModal || !nuevoEvento.playerId || !nuevoEvento.minute}
                    className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 rounded-xl transition text-sm">
                    Agregar evento
                  </button>
                </div>
              </div>

              {/* Lista de eventos */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Eventos registrados ({eventos.length})
                </h4>
                {eventos.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-4">Sin eventos registrados</p>
                ) : (
                  <div className="space-y-2">
                    {eventos.map((ev) => (
                      <div key={ev.id} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{ev.type === "GOAL" ? "⚽" : "🅰️"}</span>
                          <div>
                            <p className="text-white text-sm font-medium">{ev.player.player.name}</p>
                            <p className="text-gray-500 text-xs">
                              {ev.type === "GOAL" ? "Gol" : "Asistencia"} · min {ev.minute}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => eliminarEvento(ev.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition">
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}