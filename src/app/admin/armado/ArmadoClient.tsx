"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ArmarJornada from "./ArmarJornada";
import { DIAS, DIA_CORTO, parseCasillas, parseOpciones } from "@/lib/rol";

type Equipo = {
  id: string;
  name: string;
  diaComprado: string | null;
  horaComprada: string | null;
  prioridadCompra: number | null;
  preferencia: { opciones: unknown; bloqueos: unknown; updatedAt: string } | null;
};

type Liga = {
  id: string;
  name: string;
  categoria: "FEMENIL" | "MIXTA" | "VARONIL" | null;
  horarios: string[];
  matchDays: string[];
  teams: Equipo[];
};

type Estado = {
  org: { id: string; name: string; prefsForzadas: boolean };
  semana: string;
  ventanaAbierta: boolean;
  ligas: Liga[];
};

const BLOQUES = [
  { label: "Bloque 1", horas: ["19:40", "20:30"] },
  { label: "Bloque 2", horas: ["21:20", "22:10"] },
];

const TABS = [
  { id: "armar", label: "⚡ Armar jornada" },
  { id: "encuesta", label: "📋 Encuesta" },
  { id: "config", label: "⚙️ Configuración" },
] as const;

export default function ArmadoClient({
  organizaciones,
  org,
}: {
  organizaciones: { id: string; name: string }[];
  org: { id: string; name: string };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("armar");
  const [estado, setEstado] = useState<Estado | null>(null);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    const res = await fetch(`/api/admin/armado?org=${org.id}`);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return setError(d.error || "No se pudo cargar");
    setEstado(d);
  }, [org.id]);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/admin/armado?org=${org.id}`)
      .then(async (res) => {
        const d = await res.json().catch(() => ({}));
        if (!vivo) return;
        if (!res.ok) setError(d.error || "No se pudo cargar");
        else setEstado(d);
      })
      .catch(() => vivo && setError("No se pudo cargar"));
    return () => {
      vivo = false;
    };
  }, [org.id]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-green-400">Todas las ligas · 3 canchas</p>
          <h1 className="text-3xl font-black text-white">Armado de rol</h1>
          {estado && (
            <p className="mt-1 text-sm text-gray-500">
              Encuesta de capitanes:{" "}
              {estado.ventanaAbierta || estado.org.prefsForzadas ? (
                <span className="font-bold text-green-400">abierta</span>
              ) : (
                <span>cerrada (abre los miércoles 9:00 – 21:00)</span>
              )}
            </p>
          )}
        </div>
        {organizaciones.length > 1 && (
          <select
            value={org.id}
            onChange={(e) => router.push(`/admin/armado?org=${e.target.value}`)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
          >
            {organizaciones.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-900 p-1 text-sm font-bold">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg px-4 py-2 transition ${tab === t.id ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {!estado ? (
        <div className="h-40 animate-pulse rounded-2xl bg-gray-900" />
      ) : tab === "armar" ? (
        <ArmarJornada orgId={org.id} semanaInicial={estado.semana} />
      ) : tab === "encuesta" ? (
        <Encuesta estado={estado} />
      ) : (
        <Configuracion estado={estado} onGuardado={cargar} />
      )}
    </main>
  );
}

// ============================================================
// ENCUESTA: quién ya mandó horarios esta semana
// ============================================================

function Encuesta({ estado }: { estado: Estado }) {
  const total = estado.ligas.reduce((n, l) => n + l.teams.length, 0);
  const enviados = estado.ligas.reduce((n, l) => n + l.teams.filter((t) => t.preferencia).length, 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Semana del lunes {estado.semana}: <b className="text-white">{enviados}</b> de {total} equipos mandaron sus
        horarios.
      </p>
      {estado.ligas.map((l) => (
        <div key={l.id} className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
          <div className="flex items-center gap-3 border-b border-gray-800 px-4 py-3">
            <h3 className="flex-1 font-bold text-white">{l.name}</h3>
            <span className="text-xs text-gray-500">
              {l.teams.filter((t) => t.preferencia).length}/{l.teams.length}
            </span>
          </div>
          <div className="divide-y divide-gray-800">
            {l.teams.map((t) => {
              const ops = parseOpciones(t.preferencia?.opciones).sort((a, b) => a.prioridad - b.prioridad);
              const blq = parseCasillas(t.preferencia?.bloqueos);
              return (
                <div key={t.id} className="px-4 py-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span>{t.preferencia ? "✅" : "⏳"}</span>
                    <span className="flex-1 font-semibold text-white">{t.name}</span>
                    {(t.diaComprado || t.horaComprada) && (
                      <span className="rounded bg-purple-900/60 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
                        ⭐ {[t.diaComprado && DIA_CORTO[t.diaComprado], t.horaComprada].filter(Boolean).join(" ")} · P
                        {t.prioridadCompra ?? "—"}
                      </span>
                    )}
                  </div>
                  {t.preferencia && (
                    <p className="mt-1 pl-7 text-xs text-gray-400">
                      {ops.map((o) => `${o.prioridad}. ${DIA_CORTO[o.dia]} ${o.hora}`).join(" · ")}
                      {blq.length > 0 && (
                        <span className="text-red-400"> · 🚫 {blq.map((b) => `${DIA_CORTO[b.dia]} ${b.hora}`).join(", ")}</span>
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// CONFIGURACIÓN: categoría, días y horarios de cada liga; compras
// ============================================================

function Configuracion({ estado, onGuardado }: { estado: Estado; onGuardado: () => void }) {
  const [ligas, setLigas] = useState(estado.ligas);
  const [forzada, setForzada] = useState(estado.org.prefsForzadas);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState("");
  const [abierta, setAbierta] = useState<string | null>(null);

  function editarLiga(id: string, cambios: Partial<Liga>) {
    setLigas((prev) => prev.map((l) => (l.id === id ? { ...l, ...cambios } : l)));
  }
  function editarEquipo(ligaId: string, teamId: string, cambios: Partial<Equipo>) {
    setLigas((prev) =>
      prev.map((l) =>
        l.id === ligaId ? { ...l, teams: l.teams.map((t) => (t.id === teamId ? { ...t, ...cambios } : t)) } : l
      )
    );
  }

  async function guardar() {
    setGuardando(true);
    setMsg("");
    const res = await fetch("/api/admin/armado", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        org: estado.org.id,
        prefsForzadas: forzada,
        ligas: ligas.map((l) => ({ id: l.id, categoria: l.categoria, horarios: l.horarios, matchDays: l.matchDays })),
        equipos: ligas.flatMap((l) =>
          l.teams.map((t) => ({
            id: t.id,
            diaComprado: t.diaComprado,
            horaComprada: t.horaComprada,
            prioridadCompra: t.prioridadCompra,
          }))
        ),
      }),
    });
    const d = await res.json().catch(() => ({}));
    setGuardando(false);
    if (!res.ok) return setMsg(d.error || "No se pudo guardar");
    setMsg("✅ Configuración guardada");
    onGuardado();
  }

  // Compradores de toda la organización ordenados por prioridad
  const compradores = ligas
    .flatMap((l) => l.teams.filter((t) => t.diaComprado || t.horaComprada).map((t) => ({ ...t, liga: l.name })))
    .sort((a, b) => (a.prioridadCompra ?? 999) - (b.prioridadCompra ?? 999));

  return (
    <div className="space-y-6">
      <label className="flex items-start gap-3 rounded-2xl border border-gray-800 bg-gray-900 p-4">
        <input type="checkbox" checked={forzada} onChange={(e) => setForzada(e.target.checked)} className="mt-1 h-4 w-4" />
        <span>
          <span className="block font-bold text-white">Abrir la encuesta ahora</span>
          <span className="text-sm text-gray-500">
            Normalmente abre solo los miércoles de 9:00 a 21:00. Actívalo para abrirla fuera de horario (y apágalo al
            terminar).
          </span>
        </span>
      </label>

      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Ligas</h2>
        {ligas.map((l) => (
          <div key={l.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="min-w-0 flex-1 truncate font-bold text-white">{l.name}</h3>
              <select
                value={l.categoria ?? ""}
                onChange={(e) => editarLiga(l.id, { categoria: (e.target.value || null) as Liga["categoria"] })}
                className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
              >
                <option value="">Categoría…</option>
                <option value="FEMENIL">Femenil (1ª en rosa)</option>
                <option value="MIXTA">Mixta (2ª en rosa)</option>
                <option value="VARONIL">Varonil (3ª en rosa)</option>
              </select>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="w-16 text-xs text-gray-500">Horarios</span>
              {BLOQUES.map((b) => {
                const activo = b.horas.join() === l.horarios.join();
                return (
                  <button
                    key={b.label}
                    onClick={() => editarLiga(l.id, { horarios: b.horas })}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ${activo ? "bg-green-600 text-white" : "bg-gray-800 text-gray-400"}`}
                  >
                    {b.label}: {b.horas.join(" y ")}
                  </button>
                );
              })}
              <input
                defaultValue={l.horarios.join(", ")}
                key={l.horarios.join()}
                onBlur={(e) =>
                  editarLiga(l.id, {
                    horarios: e.target.value
                      .split(/[,\s]+/)
                      .map((h) => h.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Otros: 19:40, 20:30"
                className="w-36 rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-white"
              />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="w-16 text-xs text-gray-500">Días</span>
              {DIAS.map((d) => {
                const on = l.matchDays.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() =>
                      editarLiga(l.id, { matchDays: on ? l.matchDays.filter((x) => x !== d) : [...l.matchDays, d] })
                    }
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold ${on ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-500"}`}
                  >
                    {DIA_CORTO[d]}
                  </button>
                );
              })}
              {l.matchDays.length === 0 && <span className="text-xs text-gray-600">(sin días: se usa Lun–Vie)</span>}
            </div>

            <button
              onClick={() => setAbierta(abierta === l.id ? null : l.id)}
              className="mt-3 text-xs font-bold text-green-400"
            >
              {abierta === l.id ? "▾" : "▸"} Equipos con horario comprado (
              {l.teams.filter((t) => t.diaComprado || t.horaComprada).length})
            </button>

            {abierta === l.id && (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-gray-500">
                      <th className="py-1">Equipo</th>
                      <th>Día comprado</th>
                      <th>Hora comprada</th>
                      <th>Prioridad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {l.teams.map((t) => (
                      <tr key={t.id} className="border-t border-gray-800">
                        <td className="py-1.5 pr-2 text-white">{t.name}</td>
                        <td>
                          <select
                            value={t.diaComprado ?? ""}
                            onChange={(e) => editarEquipo(l.id, t.id, { diaComprado: e.target.value || null })}
                            className="rounded border border-gray-700 bg-gray-800 px-1.5 py-1 text-xs text-white"
                          >
                            <option value="">—</option>
                            {DIAS.map((d) => (
                              <option key={d} value={d}>
                                {DIA_CORTO[d]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            value={t.horaComprada ?? ""}
                            onChange={(e) => editarEquipo(l.id, t.id, { horaComprada: e.target.value || null })}
                            className="rounded border border-gray-700 bg-gray-800 px-1.5 py-1 text-xs text-white"
                          >
                            <option value="">—</option>
                            {l.horarios.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            min={1}
                            value={t.prioridadCompra ?? ""}
                            disabled={!t.diaComprado && !t.horaComprada}
                            onChange={(e) =>
                              editarEquipo(l.id, t.id, {
                                prioridadCompra: e.target.value ? Math.max(1, parseInt(e.target.value, 10)) : null,
                              })
                            }
                            className="w-16 rounded border border-gray-700 bg-gray-800 px-1.5 py-1 text-xs text-white disabled:opacity-30"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {compradores.length > 0 && (
        <div className="rounded-2xl border border-purple-900/50 bg-purple-950/20 p-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-purple-300">
            Orden de prioridad de compras (toda la organización)
          </h2>
          <ol className="space-y-1 text-sm">
            {compradores.map((t) => (
              <li key={t.id} className="flex gap-2 text-gray-300">
                <span className="w-8 font-black text-purple-400">{t.prioridadCompra ?? "—"}</span>
                <span className="flex-1">
                  {t.name} <span className="text-gray-500">· {t.liga}</span>
                </span>
                <span className="text-gray-400">
                  {[t.diaComprado && DIA_CORTO[t.diaComprado], t.horaComprada].filter(Boolean).join(" ")}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-gray-500">
            1 = compró primero. Si dos equipos compraron el mismo horario y no cabe, se queda el de menor número.
          </p>
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t border-gray-800 bg-gray-950/95 px-4 py-3 backdrop-blur">
        <p className="flex-1 text-sm text-gray-400">{msg}</p>
        <button
          onClick={guardar}
          disabled={guardando}
          className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Guardar configuración"}
        </button>
      </div>
    </div>
  );
}
