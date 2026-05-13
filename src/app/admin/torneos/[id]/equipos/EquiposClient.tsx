"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Player = {
  id: string;
  name: string;
  number: number | null;
  position: string | null;
};

type Team = {
  id: string;
  name: string;
  captain: string | null;
  phone: string | null;
  players: Player[];
  _count: { players: number };
};

type Torneo = {
  id: string;
  name: string;
  teams: Team[];
};

export default function EquiposClient({ torneo }: { torneo: Torneo }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [showNuevoEquipo, setShowNuevoEquipo] = useState(false);
  const [nuevoEquipo, setNuevoEquipo] = useState({ name: "", captain: "", phone: "" });

  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string | null>(null);
  const [nuevoJugador, setNuevoJugador] = useState({ name: "", number: "", position: "" });

  const POSICIONES = ["Portero", "Defensa", "Mediocampista", "Delantero"];

  async function crearEquipo() {
    if (!nuevoEquipo.name.trim()) return;
    setLoading(true);
    await fetch(`/api/admin/torneos/${torneo.id}/equipos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nuevoEquipo.name,
        captain: nuevoEquipo.captain || null,
        phone: nuevoEquipo.phone || null,
      }),
    });
    setNuevoEquipo({ name: "", captain: "", phone: "" });
    setShowNuevoEquipo(false);
    setLoading(false);
    router.refresh();
  }

  async function eliminarEquipo(teamId: string) {
    if (!confirm("¿Eliminar este equipo y todos sus jugadores?")) return;
    setLoading(true);
    await fetch(`/api/admin/torneos/${torneo.id}/equipos/${teamId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  async function agregarJugador(teamId: string) {
    if (!nuevoJugador.name.trim()) return;
    setLoading(true);
    await fetch(`/api/admin/torneos/${torneo.id}/equipos/${teamId}/jugadores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nuevoJugador.name,
        number: nuevoJugador.number ? Number(nuevoJugador.number) : null,
        position: nuevoJugador.position || null,
      }),
    });
    setNuevoJugador({ name: "", number: "", position: "" });
    setEquipoSeleccionado(null);
    setLoading(false);
    router.refresh();
  }

  async function eliminarJugador(teamId: string, playerId: string) {
    if (!confirm("¿Eliminar este jugador?")) return;
    setLoading(true);
    await fetch(`/api/admin/torneos/${torneo.id}/equipos/${teamId}/jugadores/${playerId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Equipos</h2>
          <p className="text-gray-500 text-sm mt-1">{torneo.teams.length} equipos registrados</p>
        </div>
        <button onClick={() => setShowNuevoEquipo(true)}
          className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">
          + Agregar Equipo
        </button>
      </div>

      {/* Form nuevo equipo */}
      {showNuevoEquipo && (
        <div className="bg-gray-900 border border-green-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Nuevo Equipo</h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <input
              type="text"
              placeholder="Nombre del equipo *"
              value={nuevoEquipo.name}
              onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, name: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition text-sm"
            />
            <input
              type="text"
              placeholder="Nombre del capitán"
              value={nuevoEquipo.captain}
              onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, captain: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition text-sm"
            />
            <input
              type="text"
              placeholder="WhatsApp (+52...)"
              value={nuevoEquipo.phone}
              onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, phone: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={crearEquipo} disabled={loading}
              className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-3 rounded-xl transition text-sm">
              Crear
            </button>
            <button onClick={() => setShowNuevoEquipo(false)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold px-5 py-3 rounded-xl transition text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de equipos */}
      {torneo.teams.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl">
          <p className="text-4xl mb-4">👥</p>
          <p className="text-gray-400 font-medium">No hay equipos aún</p>
          <p className="text-gray-600 text-sm mt-1">Agrega equipos para poder generar el calendario</p>
        </div>
      ) : (
        <div className="space-y-4">
          {torneo.teams.map((team) => (
            <div key={team.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

              {/* Header del equipo */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                <div>
                  <h3 className="text-white font-bold text-lg">{team.name}</h3>
                  <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                    <span>{team._count.players} jugadores</span>
                    {team.captain && <span>👤 {team.captain}</span>}
                    {team.phone && <span>📱 {team.phone}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEquipoSeleccionado(equipoSeleccionado === team.id ? null : team.id)}
                    className="text-xs bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 font-bold px-3 py-2 rounded-lg transition">
                    + Jugador
                  </button>
                  <button
                    onClick={() => eliminarEquipo(team.id)}
                    className="text-xs bg-red-900/20 hover:bg-red-900/40 text-red-400 font-bold px-3 py-2 rounded-lg transition">
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Form nuevo jugador */}
              {equipoSeleccionado === team.id && (
                <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/30">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Agregar Jugador</p>
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Nombre del jugador"
                      value={nuevoJugador.name}
                      onChange={(e) => setNuevoJugador({ ...nuevoJugador, name: e.target.value })}
                      className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Número (opcional)"
                      value={nuevoJugador.number}
                      onChange={(e) => setNuevoJugador({ ...nuevoJugador, number: e.target.value })}
                      className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition text-sm"
                    />
                    <select
                      value={nuevoJugador.position}
                      onChange={(e) => setNuevoJugador({ ...nuevoJugador, position: e.target.value })}
                      className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-green-500 transition text-sm">
                      <option value="">Posición (opcional)</option>
                      {POSICIONES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => agregarJugador(team.id)} disabled={loading}
                      className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-xl transition text-sm">
                      Agregar
                    </button>
                    <button onClick={() => setEquipoSeleccionado(null)}
                      className="bg-gray-700 hover:bg-gray-600 text-gray-400 font-bold px-4 py-2 rounded-xl transition text-sm">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista jugadores */}
              <div className="divide-y divide-gray-800">
                {team.players.length === 0 ? (
                  <p className="px-6 py-4 text-gray-600 text-sm">Sin jugadores aún</p>
                ) : (
                  team.players.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600 text-sm w-6 text-center font-mono">{p.number ?? "-"}</span>
                        <div>
                          <p className="text-white text-sm font-medium">{p.name}</p>
                          <p className="text-gray-500 text-xs">{p.position ?? "Sin posición"}</p>
                        </div>
                      </div>
                      <button onClick={() => eliminarJugador(team.id, p.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition">
                        Eliminar
                      </button>
                    </div>
                  ))
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}