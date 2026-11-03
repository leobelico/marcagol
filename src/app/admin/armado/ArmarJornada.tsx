"use client";

// Armar jornada: genera la propuesta de toda la organización, la muestra
// en una cuadrícula día × hora × cancha y deja moverla antes de publicar.
// Para mover: toca un partido y luego otra casilla (si está ocupada, se
// intercambian).

import { useMemo, useState } from "react";
import {
  revisarPropuesta,
  type LigaArmado,
  type Motivo,
  type PartidoArmado,
} from "@/lib/armadoRol";
import { CANCHA_ROSA, DIAS, DIA_CORTO, DIA_LARGO, NUM_CANCHAS, claveCasilla } from "@/lib/rol";

type Generado = {
  semana: string;
  ligas: LigaArmado[];
  omitidas: { id: string; name: string; motivo: string }[];
  ocupados: string[];
  ligasConPartidos: string[];
  partidos: PartidoArmado[];
  descansan: { ligaId: string; teamId: string }[];
};

const COLOR_CATEGORIA: Record<string, string> = {
  FEMENIL: "border-pink-600 bg-pink-950/50",
  MIXTA: "border-purple-600 bg-purple-950/50",
  VARONIL: "border-sky-700 bg-sky-950/50",
};

function fechaDia(semana: string, dia: string) {
  const d = new Date(`${semana}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + DIAS.indexOf(dia as (typeof DIAS)[number]));
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short", timeZone: "UTC" });
}

function Insignia({ m }: { m: Motivo | null }) {
  if (!m) return null;
  const base = "rounded px-1 text-[10px] font-bold";
  switch (m.tipo) {
    case "compra":
      return <span className={`${base} bg-purple-700 text-white`}>{m.completa ? "⭐ compra" : "⭐ parcial"}</span>;
    case "opcion":
      return (
        <span className={`${base} ${m.prioridad <= 3 ? "bg-green-700 text-white" : "bg-amber-700 text-white"}`}>
          #{m.prioridad}
        </span>
      );
    case "bloqueado":
      return <span className={`${base} bg-red-700 text-white`}>🚫</span>;
    case "fueraDeOpciones":
      return <span className={`${base} bg-gray-700 text-gray-300`}>fuera</span>;
    default:
      return <span className={`${base} bg-gray-800 text-gray-500`}>s/pref</span>;
  }
}

export default function ArmarJornada({ orgId, semanaInicial }: { orgId: string; semanaInicial: string }) {
  const [semana, setSemana] = useState(semanaInicial);
  const [gen, setGen] = useState<Generado | null>(null);
  const [partidos, setPartidos] = useState<PartidoArmado[]>([]);
  const [descansan, setDescansan] = useState<Generado["descansan"]>([]);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const ligaPorId = useMemo(() => new Map((gen?.ligas ?? []).map((l) => [l.id, l])), [gen]);
  const equipoPorId = useMemo(
    () => new Map((gen?.ligas ?? []).flatMap((l) => l.equipos.map((e) => [e.id, e] as const))),
    [gen]
  );
  const revision = useMemo(
    () => (gen ? revisarPropuesta(gen.ligas, partidos, gen.ocupados) : null),
    [gen, partidos]
  );

  const dias = useMemo(
    () => DIAS.filter((d) => gen?.ligas.some((l) => l.dias.includes(d))),
    [gen]
  );
  const horas = useMemo(() => [...new Set((gen?.ligas ?? []).flatMap((l) => l.horas))].sort(), [gen]);
  const ocupado = useMemo(() => new Set(gen?.ocupados ?? []), [gen]);

  async function generar() {
    setCargando(true);
    setError("");
    setExito("");
    setSeleccion(null);
    const res = await fetch("/api/admin/armado/generar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org: orgId, semana }),
    });
    const d = await res.json().catch(() => ({}));
    setCargando(false);
    if (!res.ok) return setError(d.error || "No se pudo generar");
    setGen(d);
    setSemana(d.semana);
    setPartidos(d.partidos);
    setDescansan(d.descansan);
  }

  // ---------------- edición ----------------

  function partidoEn(dia: string, hora: string, cancha: number) {
    return partidos.find((p) => p.dia === dia && p.hora === hora && p.cancha === cancha);
  }

  function tocarCasilla(dia: string, hora: string, cancha: number) {
    const aqui = partidoEn(dia, hora, cancha);
    if (!seleccion) {
      if (aqui) setSeleccion(aqui.key);
      return;
    }
    if (aqui?.key === seleccion) return setSeleccion(null);
    const sel = partidos.find((p) => p.key === seleccion)!;
    setPartidos((prev) =>
      prev.map((p) => {
        if (p.key === sel.key) return { ...p, dia, hora, cancha };
        if (aqui && p.key === aqui.key) return { ...p, dia: sel.dia, hora: sel.hora, cancha: sel.cancha };
        return p;
      })
    );
    setSeleccion(null);
  }

  function quitarHorario(key: string) {
    setPartidos((prev) => prev.map((p) => (p.key === key ? { ...p, dia: null, hora: null, cancha: null } : p)));
    setSeleccion(null);
  }

  function invertirLocal(key: string) {
    setPartidos((prev) => prev.map((p) => (p.key === key ? { ...p, homeId: p.awayId, awayId: p.homeId } : p)));
  }

  // Cambiar un equipo del partido: el equipo que entra deja su lugar
  // (otro partido o el descanso) al que sale, así nadie se duplica.
  function cambiarEquipo(key: string, lado: "homeId" | "awayId", nuevo: string) {
    const p = partidos.find((x) => x.key === key)!;
    const sale = p[lado];
    if (nuevo === sale) return;
    setPartidos((prev) =>
      prev.map((x) => {
        if (x.key === key) return { ...x, [lado]: nuevo };
        if (x.ligaId !== p.ligaId) return x;
        if (x.homeId === nuevo) return { ...x, homeId: sale };
        if (x.awayId === nuevo) return { ...x, awayId: sale };
        return x;
      })
    );
    setDescansan((prev) => prev.map((d) => (d.teamId === nuevo ? { ...d, teamId: sale } : d)));
  }

  async function publicar() {
    setPublicando(true);
    setError("");
    const res = await fetch("/api/admin/armado/publicar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org: orgId, semana, partidos }),
    });
    const d = await res.json().catch(() => ({}));
    setPublicando(false);
    setConfirmar(false);
    if (!res.ok) return setError(d.error || "No se pudo publicar");
    const resumen = (d.creadas as { ligaId: string; jornada: number; partidos: number }[])
      .map((c) => `${ligaPorId.get(c.ligaId)?.name}: Jornada ${c.jornada} (${c.partidos})`)
      .join(" · ");
    setExito(`✅ Jornada publicada. ${resumen}`);
    setGen(null);
    setPartidos([]);
  }

  // ---------------- resumen ----------------

  const sinHorario = partidos.filter((p) => !p.dia || !p.hora || !p.cancha);
  const totalAvisos = revision ? Object.values(revision.avisos).reduce((n, a) => n + a.length, 0) : 0;
  const bloqueantes = revision
    ? revision.errores.length +
      Object.values(revision.avisos)
        .flat()
        .filter((a) => a.startsWith("Choque") || a.startsWith("Esa cancha") || a.startsWith("Sin horario") || a.includes("contra sí mismo")).length
    : 0;

  const satisfaccion = useMemo(() => {
    const r = { compra: 0, top1: 0, top3: 0, otra: 0, fuera: 0, bloqueado: 0, sinPref: 0 };
    if (!revision) return r;
    for (const m of Object.values(revision.motivos)) {
      for (const x of [m.home, m.away]) {
        if (!x) continue;
        if (x.tipo === "compra") r.compra++;
        else if (x.tipo === "opcion") {
          if (x.prioridad === 1) r.top1++;
          else if (x.prioridad <= 3) r.top3++;
          else r.otra++;
        }
        else if (x.tipo === "bloqueado") r.bloqueado++;
        else if (x.tipo === "fueraDeOpciones") r.fuera++;
        else r.sinPref++;
      }
    }
    return r;
  }, [revision]);

  const seleccionado = partidos.find((p) => p.key === seleccion) ?? null;

  function tarjeta(p: PartidoArmado) {
    const liga = ligaPorId.get(p.ligaId)!;
    const m = revision?.motivos[p.key];
    const avisos = revision?.avisos[p.key] ?? [];
    return (
      <div
        className={`h-full rounded-lg border px-2 py-1.5 text-left ${COLOR_CATEGORIA[liga.categoria ?? ""] ?? "border-gray-600 bg-gray-800"} ${
          seleccion === p.key ? "ring-2 ring-yellow-400" : ""
        }`}
      >
        <p className="truncate text-[10px] font-bold uppercase tracking-wide text-gray-400">{liga.name}</p>
        <p className="flex items-center gap-1 truncate text-xs font-bold text-white">
          <span className="truncate">{equipoPorId.get(p.homeId)?.name}</span> <Insignia m={m?.home ?? null} />
        </p>
        <p className="flex items-center gap-1 truncate text-xs font-bold text-white">
          <span className="truncate">{equipoPorId.get(p.awayId)?.name}</span> <Insignia m={m?.away ?? null} />
        </p>
        {avisos.length > 0 && <p className="mt-0.5 text-[10px] font-bold text-amber-400">⚠ {avisos.length}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CONTROLES */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-800 bg-gray-900 p-4">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-500">Semana (lunes)</span>
          <input
            type="date"
            value={semana}
            onChange={(e) => setSemana(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
          />
        </label>
        <button
          onClick={generar}
          disabled={cargando}
          className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-500 disabled:opacity-50"
        >
          {cargando ? "Generando…" : gen ? "↻ Volver a generar" : "⚡ Generar jornada automática"}
        </button>
        <p className="basis-full text-xs text-gray-500">
          Se arman los cruces (sin repetir rivales) y los horarios de todas las ligas de la organización con base en
          los horarios comprados, las opciones de los capitanes y la cancha rosa. Nada se guarda hasta que publiques.
        </p>
      </div>

      {error && <p className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">{error}</p>}
      {exito && <p className="rounded-xl border border-green-900 bg-green-950/40 px-4 py-3 text-sm text-green-300">{exito}</p>}

      {gen && revision && (
        <>
          {gen.ligasConPartidos.length > 0 && (
            <p className="rounded-xl border border-amber-900 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">
              ⚠ Ya hay partidos publicados esa semana (se respetan sus canchas). Si vuelves a publicar se creará otra
              jornada para esas ligas.
            </p>
          )}
          {gen.omitidas.length > 0 && (
            <p className="text-xs text-gray-500">
              No entran: {gen.omitidas.map((o) => `${o.name} (${o.motivo})`).join(" · ")}
            </p>
          )}

          {/* RESUMEN */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {[
              { l: "Horario comprado", v: satisfaccion.compra, c: "text-purple-400" },
              { l: "1ª opción", v: satisfaccion.top1, c: "text-green-400" },
              { l: "2ª–3ª opción", v: satisfaccion.top3, c: "text-green-300" },
              { l: "4ª o más", v: satisfaccion.otra, c: "text-amber-400" },
              { l: "Fuera de opciones", v: satisfaccion.fuera, c: "text-gray-300" },
              { l: "En bloqueado", v: satisfaccion.bloqueado, c: "text-red-400" },
              { l: "Sin encuesta", v: satisfaccion.sinPref, c: "text-gray-500" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-gray-800 bg-gray-900 px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-gray-500">{s.l}</p>
                <p className={`text-xl font-black ${s.c}`}>{s.v}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 text-[11px] text-gray-400">
            <span><span className="inline-block h-2.5 w-2.5 rounded-sm bg-pink-600" /> Femenil</span>
            <span><span className="inline-block h-2.5 w-2.5 rounded-sm bg-purple-600" /> Mixta</span>
            <span><span className="inline-block h-2.5 w-2.5 rounded-sm bg-sky-700" /> Varonil</span>
            <span>#n = opción del capitán · ⭐ = horario comprado · 🚫 = lo bloqueó</span>
          </div>

          {seleccionado ? (
            <PanelSeleccion
              p={seleccionado}
              liga={ligaPorId.get(seleccionado.ligaId)!}
              avisos={revision.avisos[seleccionado.key] ?? []}
              onCerrar={() => setSeleccion(null)}
              onQuitar={() => quitarHorario(seleccionado.key)}
              onInvertir={() => invertirLocal(seleccionado.key)}
              onCambiar={(lado, id) => cambiarEquipo(seleccionado.key, lado, id)}
            />
          ) : (
            <p className="text-xs text-gray-500">Toca un partido para editarlo o moverlo.</p>
          )}

          {/* SIN HORARIO */}
          {sinHorario.length > 0 && (
            <div className="rounded-2xl border border-amber-900 bg-amber-950/20 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">
                Sin horario ({sinHorario.length}) — tócalo y luego una casilla libre
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {sinHorario.map((p) => (
                  <button key={p.key} onClick={() => setSeleccion(seleccion === p.key ? null : p.key)}>
                    {tarjeta(p)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CUADRÍCULA POR DÍA */}
          <div className="space-y-4">
            {dias.map((dia) => (
              <div key={dia} className="overflow-x-auto rounded-2xl border border-gray-800 bg-gray-900">
                <div className="border-b border-gray-800 px-4 py-2.5">
                  <h3 className="font-black text-white">
                    {DIA_LARGO[dia]} <span className="font-normal text-gray-500">{fechaDia(semana, dia)}</span>
                  </h3>
                </div>
                <table className="w-full min-w-[560px] border-separate border-spacing-1.5 text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-widest">
                      <th className="w-14" />
                      {Array.from({ length: NUM_CANCHAS }, (_, i) => i + 1)
                        .sort((a, b) => (a === CANCHA_ROSA ? -1 : b === CANCHA_ROSA ? 1 : a - b))
                        .map((c) => (
                          <th key={c} className={c === CANCHA_ROSA ? "text-pink-400" : "text-green-500"}>
                            Cancha {c} · {c === CANCHA_ROSA ? "Rosa" : "Verde"}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {horas.map((hora) => (
                      <tr key={hora}>
                        <td className="text-right text-xs font-bold text-gray-400">{hora}</td>
                        {Array.from({ length: NUM_CANCHAS }, (_, i) => i + 1)
                          .sort((a, b) => (a === CANCHA_ROSA ? -1 : b === CANCHA_ROSA ? 1 : a - b))
                          .map((c) => {
                            const p = partidoEn(dia, hora, c);
                            const publicado = ocupado.has(`${claveCasilla(dia, hora)}|${c}`);
                            return (
                              <td key={c} className="h-[84px] w-1/3 align-top">
                                {publicado && !p ? (
                                  <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-700 text-[11px] text-gray-600">
                                    Ya publicado
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => tocarCasilla(dia, hora, c)}
                                    className={`h-full w-full ${
                                      !p
                                        ? `rounded-lg border border-dashed text-[11px] ${
                                            seleccion ? "border-yellow-600 text-yellow-500" : "border-gray-800 text-gray-700"
                                          }`
                                        : ""
                                    }`}
                                  >
                                    {p ? tarjeta(p) : seleccion ? "Mover aquí" : "Libre"}
                                  </button>
                                )}
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {descansan.length > 0 && (
            <p className="text-sm text-gray-400">
              😴 Descansan:{" "}
              {descansan.map((d) => `${equipoPorId.get(d.teamId)?.name} (${ligaPorId.get(d.ligaId)?.name})`).join(" · ")}
            </p>
          )}

          {/* AVISOS + PUBLICAR */}
          <div className="sticky bottom-0 -mx-4 border-t border-gray-800 bg-gray-950/95 px-4 py-3 backdrop-blur">
            <div className="flex flex-wrap items-center gap-3">
              <p className="flex-1 text-sm text-gray-400">
                {partidos.length} partidos ·{" "}
                {totalAvisos > 0 ? <span className="text-amber-400">{totalAvisos} avisos</span> : "sin avisos"}
                {bloqueantes > 0 && <span className="text-red-400"> · corrige {bloqueantes} antes de publicar</span>}
              </p>
              <button
                onClick={() => setConfirmar(true)}
                disabled={bloqueantes > 0 || partidos.length === 0}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Publicar jornada
              </button>
            </div>
            {revision.errores.length > 0 && (
              <ul className="mt-2 text-xs text-red-400">
                {revision.errores.map((e) => (
                  <li key={e}>• {e}</li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-5">
            <h3 className="text-lg font-black text-white">¿Publicar la jornada?</h3>
            <p className="mt-2 text-sm text-gray-300">
              Se creará la siguiente jornada en {new Set(partidos.map((p) => p.ligaId)).size} ligas con {partidos.length}{" "}
              partidos para la semana del {fechaDia(semana, "MONDAY")}.
            </p>
            {totalAvisos > 0 && (
              <p className="mt-2 text-sm text-amber-400">Quedan {totalAvisos} avisos (bloqueos o compras no respetadas).</p>
            )}
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmar(false)} className="flex-1 rounded-xl bg-gray-800 py-2.5 font-bold text-gray-300">
                Cancelar
              </button>
              <button
                onClick={publicar}
                disabled={publicando}
                className="flex-1 rounded-xl bg-blue-600 py-2.5 font-bold text-white disabled:opacity-50"
              >
                {publicando ? "Publicando…" : "Publicar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PanelSeleccion({
  p,
  liga,
  avisos,
  onCerrar,
  onQuitar,
  onInvertir,
  onCambiar,
}: {
  p: PartidoArmado;
  liga: LigaArmado;
  avisos: string[];
  onCerrar: () => void;
  onQuitar: () => void;
  onInvertir: () => void;
  onCambiar: (lado: "homeId" | "awayId", id: string) => void;
}) {
  const eq = (id: string) => liga.equipos.find((e) => e.id === id);
  const resumenEquipo = (id: string) => {
    const e = eq(id);
    if (!e) return null;
    const partes: string[] = [];
    if (e.diaComprado || e.horaComprada)
      partes.push(`⭐ Compró ${[e.diaComprado && DIA_CORTO[e.diaComprado], e.horaComprada].filter(Boolean).join(" ")} (prioridad ${e.prioridadCompra ?? "—"})`);
    if (e.opciones.length)
      partes.push(
        "Opciones: " +
          [...e.opciones]
            .sort((a, b) => a.prioridad - b.prioridad)
            .map((o) => `${o.prioridad}. ${DIA_CORTO[o.dia]} ${o.hora}`)
            .join(", ")
      );
    else partes.push("No mandó encuesta");
    if (e.bloqueos.length) partes.push("🚫 " + e.bloqueos.map((b) => `${DIA_CORTO[b.dia]} ${b.hora}`).join(", "));
    return partes;
  };

  return (
    <div className="rounded-2xl border border-yellow-700 bg-gray-900 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex-1 text-sm font-bold text-yellow-400">
          ✋ Partido seleccionado — toca otra casilla para moverlo o intercambiarlo
        </p>
        <button onClick={onInvertir} className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-bold text-gray-300">
          ⇄ Local / visitante
        </button>
        <button onClick={onQuitar} className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-bold text-gray-300">
          Quitar horario
        </button>
        <button onClick={onCerrar} className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-bold text-gray-300">
          Listo
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {(["homeId", "awayId"] as const).map((lado) => (
          <div key={lado} className="rounded-xl bg-gray-800/60 p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              {lado === "homeId" ? "Local" : "Visitante"}
            </p>
            <select
              value={p[lado]}
              onChange={(e) => onCambiar(lado, e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-white"
            >
              {liga.equipos.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <ul className="mt-2 space-y-0.5 text-[11px] text-gray-400">
              {resumenEquipo(p[lado])?.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {avisos.length > 0 && (
        <ul className="mt-3 space-y-0.5 text-xs text-amber-400">
          {avisos.map((a) => (
            <li key={a}>⚠ {a}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
