"use client";

import { useMemo, useState } from "react";

type JugadorLite = {
  id: string;
  name: string;
  number: number | null;
  ineUrl?: string | null;
  documentoOficialUrl?: string | null;
};
type EquipoLite = {
  id: string;
  name: string;
  disqualified?: boolean | null;
  players: JugadorLite[];
};

type Nivel = "identico" | "muy" | "posible";
const RANGO: Record<Nivel, number> = { identico: 0, muy: 1, posible: 2 };

type Prep = {
  jugador: JugadorLite;
  equipo: { id: string; name: string };
  tokens: string[];
  key: string;
};
type Par = { a: Prep; b: Prep; nivel: Nivel; sim: number };

const STOP = new Set(["de", "del", "la", "las", "los", "y", "da", "di", "van", "von"]);

function normalizar(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + costo);
    }
    prev = curr;
  }
  return prev[b.length];
}

function similitud(a: string, b: string) {
  const max = Math.max(a.length, b.length);
  return max === 0 ? 1 : 1 - levenshtein(a, b) / max;
}

function tokensParecidos(a: string, b: string) {
  if (a === b) return true;
  return Math.min(a.length, b.length) >= 5 && levenshtein(a, b) <= 1;
}

// ¿todos los tokens del nombre corto aparecen (aprox.) en el largo?
function esSubconjunto(corto: string[], largo: string[]) {
  if (corto.length < 2) return false;
  const usados = new Set<number>();
  for (const t of corto) {
    const idx = largo.findIndex((l, i) => !usados.has(i) && tokensParecidos(t, l));
    if (idx === -1) return false;
    usados.add(idx);
  }
  return true;
}

function comparar(a: Prep, b: Prep): { nivel: Nivel; sim: number } | null {
  if (a.key === b.key) return { nivel: "identico", sim: 1 };
  const sim = similitud(a.key, b.key);
  if (sim >= 0.88) return { nivel: "muy", sim };
  const [corto, largo] = a.tokens.length <= b.tokens.length ? [a, b] : [b, a];
  if (esSubconjunto(corto.tokens, largo.tokens)) return { nivel: "posible", sim };
  if (sim >= 0.78) return { nivel: "posible", sim };
  return null;
}

function buscarSimilares(teams: EquipoLite[]): Par[] {
  const todos: Prep[] = [];
  for (const t of teams) {
    for (const j of t.players ?? []) {
      const tokens = normalizar(j.name)
        .split(" ")
        .filter((x) => x && !STOP.has(x));
      const key = [...tokens].sort().join(" ");
      if (key.length < 3) continue;
      todos.push({ jugador: j, equipo: { id: t.id, name: t.name }, tokens, key });
    }
  }

  const pares: Par[] = [];
  for (let i = 0; i < todos.length; i++) {
    for (let j = i + 1; j < todos.length; j++) {
      const r = comparar(todos[i], todos[j]);
      if (r) pares.push({ a: todos[i], b: todos[j], ...r });
    }
  }
  return pares.sort((x, y) => RANGO[x.nivel] - RANGO[y.nivel] || y.sim - x.sim);
}

const BADGE: Record<Nivel, { texto: string; clase: string }> = {
  identico: { texto: "Idéntico", clase: "bg-red-900/40 border-red-700 text-red-300" },
  muy: { texto: "Muy parecido", clase: "bg-orange-900/40 border-orange-700 text-orange-300" },
  posible: { texto: "Posible", clase: "bg-yellow-900/40 border-yellow-700 text-yellow-300" },
};

function TarjetaJugador({ p }: { p: Prep }) {
  const j = p.jugador;

  function irAlEquipo() {
    const el = document.getElementById(`equipo-${p.equipo.id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("ring-2", "ring-purple-500");
    setTimeout(() => el.classList.remove("ring-2", "ring-purple-500"), 2000);
  }

  return (
    <div className="flex-1 bg-gray-800/60 border border-gray-700 rounded-xl p-3 space-y-1 min-w-0">
      <p className="text-white font-semibold text-sm truncate">{j.name}</p>
      <p className="text-gray-400 text-xs">
        {p.equipo.name}
        {j.number != null ? ` · #${j.number}` : ""}
      </p>
      <div className="flex gap-3 text-xs pt-1 flex-wrap">
        {j.ineUrl ? (
          <a href={j.ineUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
            Ver INE
          </a>
        ) : (
          <span className="text-gray-600">Sin INE</span>
        )}
        {j.documentoOficialUrl ? (
          <a href={j.documentoOficialUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
            Ver documento
          </a>
        ) : (
          <span className="text-gray-600">Sin documento</span>
        )}
        <button onClick={irAlEquipo} className="text-purple-400 hover:underline">
          Ir al equipo ↓
        </button>
      </div>
    </div>
  );
}
export default function JugadoresSimilares({ teams }: { teams: EquipoLite[] }) {
  const [abierto, setAbierto] = useState(false);
  const [soloOtrosEquipos, setSoloOtrosEquipos] = useState(false);
  const [nivelMin, setNivelMin] = useState<Nivel>("posible");

  const totalJugadores = useMemo(
    () => teams.reduce((acc, t) => acc + (t.players?.length ?? 0), 0),
    [teams]
  );

  const pares = useMemo(() => (abierto ? buscarSimilares(teams) : []), [abierto, teams]);

  const visibles = pares.filter(
    (p) =>
      RANGO[p.nivel] <= RANGO[nivelMin] &&
      (!soloOtrosEquipos || p.a.equipo.id !== p.b.equipo.id)
  );

  const cuenta = (n: Nivel) => pares.filter((p) => p.nivel === n).length;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-black text-white">🔍 Jugadores con nombres parecidos</h3>
          <p className="text-gray-500 text-xs mt-1">
            Revisa {totalJugadores} jugadores de {teams.length} equipos del torneo para detectar posibles duplicados.
          </p>
        </div>
        <button
          onClick={() => setAbierto((v) => !v)}
          className="bg-purple-700 hover:bg-purple-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm"
        >
          {abierto ? "Ocultar" : "Buscar similares"}
        </button>
      </div>

      {abierto && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap text-xs">
            <span className="text-red-300">Idénticos: <b>{cuenta("identico")}</b></span>
            <span className="text-orange-300">Muy parecidos: <b>{cuenta("muy")}</b></span>
            <span className="text-yellow-300">Posibles: <b>{cuenta("posible")}</b></span>

            <select
              value={nivelMin}
              onChange={(e) => setNivelMin(e.target.value as Nivel)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-300 text-xs focus:outline-none"
            >
              <option value="posible">Mostrar todos</option>
              <option value="muy">Solo muy parecidos e idénticos</option>
              <option value="identico">Solo idénticos</option>
            </select>

            <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={soloOtrosEquipos}
                onChange={(e) => setSoloOtrosEquipos(e.target.checked)}
              />
              Solo entre equipos distintos
            </label>
          </div>

          {visibles.length === 0 ? (
            <div className="bg-green-900/20 border border-green-800 rounded-xl px-4 py-3 text-green-400 text-sm">
              ✅ No se encontraron jugadores con nombres parecidos con este filtro.
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {visibles.map((p, i) => (
                <div key={`${p.a.jugador.id}-${p.b.jugador.id}-${i}`} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${BADGE[p.nivel].clase}`}>
                      {BADGE[p.nivel].texto}
                    </span>
                    <span className="text-gray-600 text-xs">{Math.round(p.sim * 100)}% similitud</span>
                    {p.a.equipo.id === p.b.equipo.id && (
                      <span className="text-gray-500 text-xs">· mismo equipo</span>
                    )}
                  </div>
                  <div className="flex gap-3 flex-col sm:flex-row">
                    <TarjetaJugador p={p.a} />
                    <TarjetaJugador p={p.b} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}