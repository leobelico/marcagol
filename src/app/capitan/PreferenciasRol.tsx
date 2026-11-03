"use client";

// Encuesta semanal de horarios: el capitán marca de 5 a 10 opciones en
// orden de prioridad (una sola cancha: el sistema reparte las canchas)
// y puede bloquear los horarios en que definitivamente no puede.

import { useEffect, useMemo, useState } from "react";
import {
  DIA_CORTO,
  DIA_LARGO,
  claveCasilla,
  maxBloqueos,
  topesSeleccion,
  validarSeleccion,
  type Casilla,
  type Opcion,
} from "@/lib/rol";

type Datos = {
  abierta: boolean;
  semana: string;
  dias: string[];
  horas: string[];
  configurada: boolean;
  opciones: Opcion[];
  bloqueos: Casilla[];
  enviadoEl: string | null;
  saturacion: Record<string, { equipos: number; nivel: "libre" | "solicitado" | "saturado" }>;
  compra: { dia: string | null; hora: string | null };
  limites: { minOpciones: number; maxOpciones: number; maxBloqueos: number };
};

export default function PreferenciasRol({ teamId }: { teamId: string }) {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState("");
  const [orden, setOrden] = useState<Casilla[]>([]); // opciones en orden de prioridad
  const [bloqueos, setBloqueos] = useState<Casilla[]>([]);
  const [modo, setModo] = useState<"opciones" | "bloquear">("opciones");
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    let vivo = true;
    fetch(`/api/capitan/preferencias?teamId=${teamId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!vivo) return;
        if (d.error) return setError(d.error);
        setDatos(d);
        setOrden([...d.opciones].sort((a: Opcion, b: Opcion) => a.prioridad - b.prioridad));
        setBloqueos(d.bloqueos);
      })
      .catch(() => vivo && setError("No se pudo cargar la encuesta de horarios"));
    return () => {
      vivo = false;
    };
  }, [teamId]);

  const opciones: Opcion[] = orden.map((c, i) => ({ ...c, prioridad: i + 1 }));
  const errores = useMemo(
    () => (datos ? validarSeleccion(opciones, bloqueos, datos.dias, datos.horas) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [datos, orden, bloqueos]
  );

  if (error) return null;
  if (!datos) {
    return <section className="h-40 animate-pulse rounded-2xl border border-gray-800 bg-gray-900" />;
  }
  if (!datos.configurada) return null; // la liga aún no tiene horarios de bloque

  const editable = datos.abierta;
  const totalCasillas = datos.dias.length * datos.horas.length;
  const topeBloqueos = maxBloqueos(totalCasillas, Math.max(orden.length, datos.limites.minOpciones));
  const topes = topesSeleccion(Math.max(orden.length, datos.limites.minOpciones), datos.dias.length, datos.horas.length);

  const posicion = (dia: string, hora: string) => orden.findIndex((c) => c.dia === dia && c.hora === hora);
  const bloqueada = (dia: string, hora: string) => bloqueos.some((c) => c.dia === dia && c.hora === hora);

  function tocar(dia: string, hora: string) {
    if (!editable) return;
    setAviso("");
    const pos = posicion(dia, hora);
    const blq = bloqueada(dia, hora);

    if (modo === "opciones") {
      if (pos >= 0) return setOrden(orden.filter((_, i) => i !== pos));
      if (blq) return setAviso("Ese horario está bloqueado. Desbloquéalo primero.");
      if (orden.length >= datos!.limites.maxOpciones) {
        return setAviso(`Máximo ${datos!.limites.maxOpciones} opciones.`);
      }
      setOrden([...orden, { dia, hora }]);
    } else {
      if (blq) return setBloqueos(bloqueos.filter((c) => !(c.dia === dia && c.hora === hora)));
      if (pos >= 0) return setAviso("Ese horario está en tus opciones. Quítalo primero.");
      if (bloqueos.length >= topeBloqueos) return setAviso(`Puedes bloquear máximo ${topeBloqueos} horarios.`);
      setBloqueos([...bloqueos, { dia, hora }]);
    }
  }

  function mover(i: number, delta: number) {
    const j = i + delta;
    if (j < 0 || j >= orden.length) return;
    const nuevo = [...orden];
    [nuevo[i], nuevo[j]] = [nuevo[j], nuevo[i]];
    setOrden(nuevo);
  }

  async function enviar() {
    setEnviando(true);
    setAviso("");
    const res = await fetch("/api/capitan/preferencias", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, opciones, bloqueos }),
    });
    const d = await res.json().catch(() => ({}));
    setEnviando(false);
    setConfirmar(false);
    if (!res.ok) return setAviso(d.error || "No se pudo enviar");
    setDatos({ ...datos!, enviadoEl: d.enviadoEl });
    setAviso("✅ Tus horarios se enviaron. Puedes modificarlos mientras la encuesta siga abierta.");
  }

  const semanaTxt = new Date(`${datos.semana}T12:00:00Z`).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-900 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400">🗓️ Horarios de la semana</p>
          <h2 className="mt-1 text-lg font-black text-white">Semana del lunes {semanaTxt}</h2>
          <p className="mt-1 text-sm text-gray-500">
            Elige de {datos.limites.minOpciones} a {datos.limites.maxOpciones} horarios en orden de prioridad.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            editable ? "bg-green-900/40 text-green-400" : "bg-gray-800 text-gray-400"
          }`}
        >
          {editable ? "● Encuesta abierta" : "Abre los miércoles 9:00 – 21:00"}
        </span>
      </div>

      {datos.compra.dia || datos.compra.hora ? (
        <p className="mt-3 rounded-xl border border-purple-900/50 bg-purple-950/30 px-3 py-2 text-xs text-purple-300">
          ⭐ Tu equipo tiene horario comprado:{" "}
          <b>{[datos.compra.dia && DIA_LARGO[datos.compra.dia], datos.compra.hora].filter(Boolean).join(" ")}</b>.
          Se respeta primero; tus opciones sirven si hace falta moverte.
        </p>
      ) : null}

      {editable && (
        <div className="mt-4 flex rounded-xl bg-gray-800 p-1 text-sm font-bold">
          <button
            onClick={() => setModo("opciones")}
            className={`flex-1 rounded-lg px-3 py-2 transition ${modo === "opciones" ? "bg-blue-600 text-white" : "text-gray-400"}`}
          >
            Mis opciones ({orden.length}/{datos.limites.maxOpciones})
          </button>
          <button
            onClick={() => setModo("bloquear")}
            className={`flex-1 rounded-lg px-3 py-2 transition ${modo === "bloquear" ? "bg-red-600 text-white" : "text-gray-400"}`}
          >
            🚫 No puedo ({bloqueos.length}/{topeBloqueos})
          </button>
        </div>
      )}

      {/* TABLA: filas = horarios del bloque, columnas = días. Una sola cancha. */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[300px] border-separate border-spacing-1 text-center text-sm">
          <thead>
            <tr>
              <th className="w-14" />
              {datos.dias.map((d) => (
                <th key={d} className="pb-1 text-xs font-bold uppercase text-gray-500">
                  {DIA_CORTO[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {datos.horas.map((h) => (
              <tr key={h}>
                <td className="pr-1 text-right text-xs font-bold text-gray-400">{h}</td>
                {datos.dias.map((d) => {
                  const pos = posicion(d, h);
                  const blq = bloqueada(d, h);
                  const sat = datos.saturacion[claveCasilla(d, h)]?.nivel;
                  const comprada =
                    (!datos.compra.dia || datos.compra.dia === d) &&
                    (!datos.compra.hora || datos.compra.hora === h) &&
                    !!(datos.compra.dia || datos.compra.hora);
                  return (
                    <td key={d}>
                      <button
                        onClick={() => tocar(d, h)}
                        disabled={!editable}
                        aria-label={`${DIA_LARGO[d]} ${h}`}
                        className={`relative flex h-14 w-full flex-col items-center justify-center rounded-xl border text-base font-black transition ${
                          pos >= 0
                            ? "border-blue-500 bg-blue-600 text-white"
                            : blq
                              ? "border-red-800 bg-red-950/60 text-red-400"
                              : "border-gray-700 bg-gray-800/60 text-gray-600 hover:border-gray-500"
                        } ${comprada ? "ring-2 ring-purple-500" : ""}`}
                      >
                        {pos >= 0 ? pos + 1 : blq ? "🚫" : "+"}
                        {sat && sat !== "libre" && (
                          <span
                            className={`absolute bottom-0.5 text-[9px] font-bold leading-none ${
                              sat === "saturado" ? "text-red-300" : "text-amber-300"
                            }`}
                          >
                            {sat === "saturado" ? "SATURADO" : "Muy pedido"}
                          </span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
        <span>
          <b className="text-red-300">SATURADO</b>: muchos equipos lo pidieron, será difícil.
        </span>
        <span>
          <b className="text-amber-300">Muy pedido</b>: tiene bastante demanda.
        </span>
        <span>
          Máx. {topes.porDia} por día y {topes.porHora} en un mismo horario.
        </span>
      </div>

      {/* LISTA ORDENADA */}
      {orden.length > 0 && (
        <ol className="mt-4 space-y-1.5">
          {orden.map((c, i) => (
            <li key={claveCasilla(c.dia, c.hora)} className="flex items-center gap-2 rounded-lg bg-gray-800/60 px-3 py-2 text-sm">
              <span className="w-6 font-black text-blue-400">{i + 1}</span>
              <span className="flex-1 text-white">
                {DIA_LARGO[c.dia]} · {c.hora}
              </span>
              {editable && (
                <>
                  <button onClick={() => mover(i, -1)} disabled={i === 0} className="px-2 text-gray-400 disabled:opacity-30" aria-label="Subir">
                    ↑
                  </button>
                  <button onClick={() => mover(i, 1)} disabled={i === orden.length - 1} className="px-2 text-gray-400 disabled:opacity-30" aria-label="Bajar">
                    ↓
                  </button>
                </>
              )}
            </li>
          ))}
        </ol>
      )}

      {editable && orden.length > 0 && errores.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-amber-400">
          {errores.map((e) => (
            <li key={e}>• {e}</li>
          ))}
        </ul>
      )}

      {aviso && <p className="mt-3 text-sm text-gray-300">{aviso}</p>}

      {datos.enviadoEl && (
        <p className="mt-3 text-xs text-green-500">
          Enviado el{" "}
          {new Date(datos.enviadoEl).toLocaleString("es-MX", {
            weekday: "long",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Mexico_City",
          })}
        </p>
      )}

      {editable && (
        <button
          onClick={() => setConfirmar(true)}
          disabled={errores.length > 0}
          className="mt-4 w-full rounded-xl bg-green-600 py-3 font-bold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {datos.enviadoEl ? "Actualizar mis horarios" : "Enviar mis horarios"}
        </button>
      )}

      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-5">
            <h3 className="text-lg font-black text-white">Antes de enviar</h3>
            <p className="mt-2 text-sm text-gray-300">
              Tus opciones <b>no garantizan</b> el horario. El rol se arma con base en ellas en la medida de lo
              posible, junto con las de los demás equipos y los horarios comprados.
            </p>
            <p className="mt-2 text-sm text-gray-400">
              {orden.length} opciones · {bloqueos.length} horarios bloqueados
            </p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmar(false)} className="flex-1 rounded-xl bg-gray-800 py-2.5 font-bold text-gray-300">
                Revisar
              </button>
              <button
                onClick={enviar}
                disabled={enviando}
                className="flex-1 rounded-xl bg-green-600 py-2.5 font-bold text-white disabled:opacity-50"
              >
                {enviando ? "Enviando…" : "Entendido, enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
