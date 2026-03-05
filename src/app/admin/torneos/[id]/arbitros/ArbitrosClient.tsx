"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Match = {
  id: string;
  date: Date;
  homeTeam: { name: string };
  awayTeam: { name: string };
  status: string;
  refereeId: string | null;
};

type Round = {
  id: string;
  number: number;
  name: string | null;
  matches: Match[];
};

type Referee = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  payPerMatch: number;
  notes: string | null;
  matches: Match[];
};

type Torneo = {
  id: string;
  referees: Referee[];
  rounds: Round[];
};

export default function ArbitrosClient({ torneo }: { torneo: Torneo }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [asignando, setAsignando] = useState<string | null>(null); // matchId
  const [form, setForm] = useState({
    name: "", phone: "", email: "", payPerMatch: "", notes: "",
  });

  // Partidos sin árbitro
  const sinArbitro = torneo.rounds.flatMap(r => r.matches);

  async function crearArbitro() {
    if (!form.name.trim()) return;
    setLoading(true);
    await fetch(`/api/admin/torneos/${torneo.id}/arbitros`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        payPerMatch: Number(form.payPerMatch) || 0,
      }),
    });
    setForm({ name: "", phone: "", email: "", payPerMatch: "", notes: "" });
    setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  async function eliminarArbitro(refereeId: string) {
    if (!confirm("¿Eliminar este árbitro?")) return;
    setLoading(true);
    await fetch(`/api/admin/torneos/${torneo.id}/arbitros/${refereeId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  async function asignarArbitro(matchId: string, refereeId: string) {
    setLoading(true);
    await fetch(`/api/admin/partidos/${matchId}/arbitro`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refereeId }),
    });
    setAsignando(null);
    setLoading(false);
    router.refresh();
  }

  async function quitarArbitro(matchId: string) {
    setLoading(true);
    await fetch(`/api/admin/partidos/${matchId}/arbitro`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refereeId: null }),
    });
    setLoading(false);
    router.refresh();
  }

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Árbitros</h2>
          <p className="text-gray-500 text-sm mt-1">{torneo.referees.length} árbitros registrados</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">
          + Agregar Árbitro
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-gray-900 border border-green-800/50 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Nuevo Árbitro</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Nombre *</label>
              <input type="text" placeholder="Nombre completo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Teléfono / WhatsApp</label>
              <input type="text" placeholder="+52 81 1234 5678"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Email</label>
              <input type="email" placeholder="arbitro@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Pago por partido ($)</label>
              <input type="number" min={0} placeholder="0.00"
                value={form.payPerMatch}
                onChange={(e) => setForm({ ...form, payPerMatch: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Notas</label>
            <input type="text" placeholder="Notas adicionales..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={crearArbitro} disabled={loading || !form.name}
              className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 rounded-xl transition text-sm">
              {loading ? "Guardando..." : "Guardar"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold py-3 rounded-xl transition text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Partidos sin árbitro */}
      {sinArbitro.length > 0 && (
        <div className="bg-yellow-950/20 border border-yellow-800/40 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-4">
            ⚠️ Partidos sin árbitro asignado ({sinArbitro.length})
          </h3>
          <div className="space-y-2">
            {sinArbitro.map((m) => (
              <div key={m.id} className="flex items-center justify-between bg-gray-900 rounded-xl px-4 py-3">
                <div>
                  <p className="text-white text-sm font-medium">
                    {m.homeTeam.name} vs {m.awayTeam.name}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {new Date(m.date).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                </div>
                {asignando === m.id ? (
                  <div className="flex items-center gap-2">
                    <select
                      onChange={(e) => e.target.value && asignarArbitro(m.id, e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-green-500">
                      <option value="">Seleccionar árbitro</option>
                      {torneo.referees.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    <button onClick={() => setAsignando(null)}
                      className="text-xs text-gray-500 hover:text-white transition">✕</button>
                  </div>
                ) : (
                  <button onClick={() => setAsignando(m.id)}
                    className="text-xs bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-400 font-bold px-3 py-1.5 rounded-lg transition">
                    Asignar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de árbitros */}
      {torneo.referees.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl">
          <p className="text-4xl mb-4">🟨</p>
          <p className="text-gray-400 font-medium">Sin árbitros registrados</p>
          <p className="text-gray-600 text-sm mt-1">Agrega árbitros para asignarlos a los partidos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {torneo.referees.map((ref) => {
            const totalGanado = ref.matches.length * ref.payPerMatch;
            const isExpanded = expandido === ref.id;

            return (
              <div key={ref.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-yellow-900/40 rounded-xl flex items-center justify-center text-xl">🟨</div>
                    <div>
                      <p className="text-white font-bold">{ref.name}</p>
                      <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                        {ref.phone && <span>📱 {ref.phone}</span>}
                        {ref.email && <span>✉️ {ref.email}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-white font-bold text-sm">{ref.matches.length} partidos</p>
                      {ref.payPerMatch > 0 && (
                        <p className="text-green-400 text-xs">{formatMoney(totalGanado)} total</p>
                      )}
                    </div>
                    <button onClick={() => setExpandido(isExpanded ? null : ref.id)}
                      className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold px-3 py-2 rounded-lg transition">
                      {isExpanded ? "Ocultar" : "Historial"}
                    </button>
                    <button onClick={() => eliminarArbitro(ref.id)}
                      className="text-xs bg-red-900/20 hover:bg-red-900/40 text-red-400 font-bold px-3 py-2 rounded-lg transition">
                      Eliminar
                    </button>
                  </div>
                </div>

                {/* Historial */}
                {isExpanded && (
                  <div className="border-t border-gray-800">
                    {ref.matches.length === 0 ? (
                      <p className="px-6 py-4 text-gray-600 text-sm">Sin partidos asignados aún</p>
                    ) : (
                      <div className="divide-y divide-gray-800">
                        {ref.matches.map((m) => (
                          <div key={m.id} className="px-6 py-3 flex items-center justify-between">
                            <div>
                              <p className="text-white text-sm">{m.homeTeam.name} vs {m.awayTeam.name}</p>
                              <p className="text-gray-500 text-xs">
                                {new Date(m.date).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              {ref.payPerMatch > 0 && (
                                <span className="text-green-400 text-xs font-bold">{formatMoney(ref.payPerMatch)}</span>
                              )}
                              <button onClick={() => quitarArbitro(m.id)}
                                className="text-xs text-red-400 hover:text-red-300 transition">
                                Quitar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}