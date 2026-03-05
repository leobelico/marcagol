"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Team = { id: string; name: string };
type Finance = {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string | null;
  date: Date;
  team: Team | null;
};
type Torneo = { id: string; teams: Team[]; finances: Finance[] };

const CATEGORIAS = [
  { value: "CUOTA_EQUIPO",   label: "Cuota de equipo",   icon: "👥", type: "INCOME" },
  { value: "PREMIO",         label: "Premio",            icon: "🏆", type: "EXPENSE" },
  { value: "PAGO_ARBITRO",   label: "Pago árbitro",      icon: "🟨", type: "EXPENSE" },
  { value: "GASTO_CANCHA",   label: "Renta de cancha",   icon: "🏟️", type: "EXPENSE" },
  { value: "GASTO_TROFEOS",  label: "Trofeos/medallas",  icon: "🥇", type: "EXPENSE" },
  { value: "GASTO_GENERAL",  label: "Gasto general",     icon: "📦", type: "EXPENSE" },
  { value: "OTRO",           label: "Otro",              icon: "💰", type: "INCOME" },
];

export default function FinanzasClient({ torneo }: { torneo: Torneo }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "INCOME",
    category: "CUOTA_EQUIPO",
    amount: "",
    description: "",
    teamId: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Calcular totales
  const totalIngresos = torneo.finances
    .filter(f => f.type === "INCOME")
    .reduce((sum, f) => sum + f.amount, 0);

  const totalEgresos = torneo.finances
    .filter(f => f.type === "EXPENSE")
    .reduce((sum, f) => sum + f.amount, 0);

  const balance = totalIngresos - totalEgresos;

  // Agrupar por categoría
  const porCategoria = CATEGORIAS.map(cat => ({
    ...cat,
    total: torneo.finances
      .filter(f => f.category === cat.value)
      .reduce((sum, f) => sum + f.amount, 0),
    count: torneo.finances.filter(f => f.category === cat.value).length,
  })).filter(c => c.count > 0);

  async function agregarMovimiento() {
    if (!form.amount || Number(form.amount) <= 0) return;
    setLoading(true);
    await fetch(`/api/admin/torneos/${torneo.id}/finanzas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount),
      }),
    });
    setForm({
      type: "INCOME",
      category: "CUOTA_EQUIPO",
      amount: "",
      description: "",
      teamId: "",
      date: new Date().toISOString().split("T")[0],
    });
    setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  async function eliminarMovimiento(id: string) {
    if (!confirm("¿Eliminar este movimiento?")) return;
    setLoading(true);
    await fetch(`/api/admin/torneos/${torneo.id}/finanzas/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

  const catLabel = (cat: string) => CATEGORIAS.find(c => c.value === cat)?.label ?? cat;
  const catIcon = (cat: string) => CATEGORIAS.find(c => c.value === cat)?.icon ?? "💰";

  return (
    <div className="space-y-6">

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-950/30 border border-green-900/50 rounded-2xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total Ingresos</p>
          <p className="text-3xl font-black text-green-400">{formatMoney(totalIngresos)}</p>
        </div>
        <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total Egresos</p>
          <p className="text-3xl font-black text-red-400">{formatMoney(totalEgresos)}</p>
        </div>
        <div className={`border rounded-2xl p-5 ${balance >= 0 ? "bg-blue-950/30 border-blue-900/50" : "bg-red-950/30 border-red-900/50"}`}>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Balance</p>
          <p className={`text-3xl font-black ${balance >= 0 ? "text-blue-400" : "text-red-400"}`}>
            {formatMoney(balance)}
          </p>
        </div>
      </div>

      {/* Resumen por categoría */}
      {porCategoria.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Por Categoría</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {porCategoria.map(cat => (
              <div key={cat.value} className="bg-gray-800 rounded-xl px-4 py-3">
                <p className="text-sm mb-1">{cat.icon} <span className="text-gray-300 font-medium">{cat.label}</span></p>
                <p className={`font-black text-lg ${cat.type === "INCOME" ? "text-green-400" : "text-red-400"}`}>
                  {formatMoney(cat.total)}
                </p>
                <p className="text-xs text-gray-500">{cat.count} movimientos</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header + botón */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Movimientos</h2>
          <p className="text-gray-500 text-sm mt-1">{torneo.finances.length} registros</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">
          + Agregar
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-gray-900 border border-green-800/50 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Nuevo Movimiento</h3>

          {/* Tipo */}
          <div className="flex gap-3">
            <button
              onClick={() => setForm({ ...form, type: "INCOME", category: "CUOTA_EQUIPO" })}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${form.type === "INCOME" ? "bg-green-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              ↑ Ingreso
            </button>
            <button
              onClick={() => setForm({ ...form, type: "EXPENSE", category: "PAGO_ARBITRO" })}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${form.type === "EXPENSE" ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              ↓ Egreso
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Categoría */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Categoría</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500">
                {CATEGORIAS.filter(c => c.type === form.type || c.value === "OTRO").map(c => (
                  <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>

            {/* Monto */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Monto ($)</label>
              <input
                type="number" min={0} step={0.01}
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
              />
            </div>

            {/* Equipo (opcional) */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Equipo (opcional)</label>
              <select
                value={form.teamId}
                onChange={(e) => setForm({ ...form, teamId: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500">
                <option value="">Sin equipo</option>
                {torneo.teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Fecha */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Fecha</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Descripción (opcional)</label>
            <input
              type="text"
              placeholder="Ej. Cuota jornada 1 - Tigres FC"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={agregarMovimiento} disabled={loading || !form.amount}
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

      {/* Lista de movimientos */}
      {torneo.finances.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl">
          <p className="text-4xl mb-4">💰</p>
          <p className="text-gray-400 font-medium">Sin movimientos aún</p>
          <p className="text-gray-600 text-sm mt-1">Agrega ingresos y egresos del torneo</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-left">Equipo</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {torneo.finances.map((f) => (
                <tr key={f.id} className="border-t border-gray-800 hover:bg-gray-800/50 transition">
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(f.date).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-300 text-xs">
                      {catIcon(f.category)} {catLabel(f.category)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{f.description ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{f.team?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${f.type === "INCOME" ? "text-green-400" : "text-red-400"}`}>
                      {f.type === "INCOME" ? "+" : "-"}{formatMoney(f.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => eliminarMovimiento(f.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}