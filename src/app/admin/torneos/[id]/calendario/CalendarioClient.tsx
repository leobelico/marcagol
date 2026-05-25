"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Team = { id: string; name: string };
type Match = { id: string; date: Date; homeTeam: Team; awayTeam: Team; status: string; cancha?: number | null;  };
type Round = { id: string; number: number; name: string | null; matches: Match[] };
type Torneo = {
  id: string;
  name: string;
  teams: Team[];
  rounds: Round[];
  startDate: Date | null;
  matchDays: string[];
  matchesPerDay: number;
  roundTrip: boolean;
  
};

const DIAS_LABEL: Record<string, string> = {
  MONDAY: "Lunes", TUESDAY: "Martes", WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves", FRIDAY: "Viernes", SATURDAY: "Sábado", SUNDAY: "Domingo",
};

export default function CalendarioClient({ torneo }: { torneo: Torneo }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [notifResult, setNotifResult] = useState("");
  const [modo, setModo] = useState<"auto" | "manual">("auto");
  const [showImport, setShowImport] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importMappings, setImportMappings] = useState<Record<string, string>>({});
  const [importando, setImportando] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  // Estado formulario manual
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [cancha, setCancha] = useState<1 | 2>(1);
  const [roundId, setRoundId] = useState("");
  const [agregando, setAgregando] = useState(false);
  const [errorManual, setErrorManual] = useState("");
  const [successManual, setSuccessManual] = useState("");

  const tieneCalendario = torneo.rounds.length > 0;
  const puedeGenerar = torneo.teams.length >= 2 && torneo.matchDays.length > 0 && torneo.startDate;

  const numEquipos = torneo.teams.length;
  const numJornadas = torneo.roundTrip
    ? (numEquipos % 2 === 0 ? (numEquipos - 1) * 2 : numEquipos * 2)
    : (numEquipos % 2 === 0 ? numEquipos - 1 : numEquipos);
  const partidosPorJornada = Math.floor(numEquipos / 2);
  const totalPartidos = numJornadas * partidosPorJornada;

  async function generarCalendario() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/torneos/${torneo.id}/calendario/generar`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) { setError(json.error || "Error al generar"); setLoading(false); return; }
    setConfirmar(false);
    setLoading(false);
    router.refresh();
  }

  async function eliminarCalendario() {
    if (!confirm("¿Eliminar todo el calendario?")) return;
    setLoading(true);
    await fetch(`/api/admin/torneos/${torneo.id}/calendario/generar`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }
function excelDateToDate(serial: number): string {
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizarFecha(val: any): string {
  if (typeof val === "number") return excelDateToDate(val);
  const str = String(val).trim();
  // formato dd/mm/yyyy → yyyy-mm-dd
  if (str.includes("/")) {
    const [d, m, y] = str.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return str; // ya está en yyyy-mm-dd
}
function excelTimeToTime(serial: number): string {
  const totalMinutes = Math.round(serial * 24 * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;
  import("xlsx").then(XLSX => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws, { raw: true });

      // Normalizar fecha y hora
      const rowsNormalizadas = rows.map((r: any) => ({
        ...r,
        fecha: normalizarFecha(r.fecha),
        hora: typeof r.hora === "number" ? excelTimeToTime(r.hora) : String(r.hora),
      }));

      setImportRows(rowsNormalizadas);

      // Detectar equipos no reconocidos
      const nombresEnExcel = new Set<string>();
      rowsNormalizadas.forEach((r: any) => {
        if (r.equipo_local) nombresEnExcel.add(r.equipo_local.trim());
        if (r.equipo_visitante) nombresEnExcel.add(r.equipo_visitante.trim());
      });

      const mappings: Record<string, string> = {};
      nombresEnExcel.forEach(nombre => {
        const match = torneo.teams.find(t =>
          t.name.toLowerCase().trim() === nombre.toLowerCase()
        );
        mappings[nombre] = match?.id || "";
      });
      setImportMappings(mappings);
      setImportError("");
      setImportSuccess("");
    };
    reader.readAsBinaryString(file);
  });
}

async function confirmarImportacion() {
  // Verificar que todos los equipos están mapeados
  const sinMapear = Object.entries(importMappings).filter(([, v]) => !v);
  if (sinMapear.length > 0) {
    setImportError(`Asigna los equipos sin reconocer: ${sinMapear.map(([k]) => k).join(", ")}`);
    return;
  }

  setImportando(true);
  setImportError("");

  const partidos = importRows.map((r: any) => ({
    jornada: Number(r.jornada),
    homeTeamId: importMappings[r.equipo_local?.trim()],
    awayTeamId: importMappings[r.equipo_visitante?.trim()],
    fecha: r.fecha,
    hora: r.hora,
    cancha: Number(r.cancha) || 1,
  }));

  const res = await fetch(`/api/admin/torneos/${torneo.id}/calendario/importar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ partidos }),
  });

  const json = await res.json();
if (!res.ok) {
  setImportError(json.error || "Error al importar");
} else {
  const msg = `✅ ${json.creados} partidos importados`;
  const errMsg = json.errores?.length ? `\n⚠️ ${json.errores.join("\n")}` : "";
  setImportSuccess(msg);
  if (json.errores?.length) setImportError(json.errores.join(" | "));
  if (json.creados > 0) {
    setImportRows([]);
    setImportMappings({});
    router.refresh();
  }
}
  setImportando(false);
}


  async function enviarNotificaciones() {
    setEnviando(true);
    const res = await fetch(`/api/admin/torneos/${torneo.id}/notificar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "calendario" }),
    });
    const json = await res.json();
    const enviados = json.resultados?.filter((r: any) => r.ok).length ?? 0;
    setNotifResult(`✓ ${enviados} equipos notificados`);
    setEnviando(false);
  }

  async function agregarPartidoManual() {
    setErrorManual("");
    setSuccessManual("");
    if (!homeTeamId || !awayTeamId || !fecha || !hora) {
      setErrorManual("Completa todos los campos");
      return;
    }
    if (homeTeamId === awayTeamId) {
      setErrorManual("Selecciona dos equipos diferentes");
      return;
    }
    setAgregando(true);
    const dateTime = new Date(`${fecha}T${hora}:00`);
    const res = await fetch(`/api/admin/torneos/${torneo.id}/calendario/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeTeamId, awayTeamId, date: dateTime, cancha, roundId: roundId || null }),
    });
    const json = await res.json();
    if (!res.ok) {
      setErrorManual(json.error || "Error al agregar partido");
    } else {
      setSuccessManual("✅ Partido agregado correctamente");
      setHomeTeamId("");
      setAwayTeamId("");
      setFecha("");
      setHora("");
      setCancha(1);
      setRoundId("");
      router.refresh();
    }
    setAgregando(false);
  }

  async function generarCedula(match: Match) {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const home = match.homeTeam.name;
    const away = match.awayTeam.name;
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("CÉDULA ARBITRAL", pageW / 2, 15, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Árbitro: ____________________", 20, 30);
    doc.text(`Cancha: ${match.cancha ?? "___"}`, 110, 30);
    doc.text(`Fecha: ${new Date(match.date).toLocaleDateString("es-MX")}`, 20, 38);
    doc.setFillColor(0, 80, 0);
    doc.rect(20, 46, 80, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`Equipo: ${home}`, 22, 50);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    let yA = 56;
    for (let i = 0; i < 10; i++) { doc.text(`# ___   Jugador ________________   G ____   E ____`, 20, yA); yA += 6; }
    doc.setFillColor(0, 80, 0);
    doc.rect(110, 46, 80, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`Equipo: ${away}`, 112, 50);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    let yB = 56;
    for (let i = 0; i < 10; i++) { doc.text(`# ____   Jugador __________________   G ____   E ____`, 110, yB); yB += 6; }
    doc.save(`Cedula_${home}_vs_${away}.pdf`);
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Calendario</h2>
          <p className="text-gray-500 text-sm mt-1">
            {tieneCalendario ? `${torneo.rounds.length} jornadas` : "Sin calendario aún"}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {/* Toggle modo */}
          <div className="flex bg-gray-800 rounded-xl p-1">
            <button onClick={() => setModo("auto")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${modo === "auto" ? "bg-green-600 text-white" : "text-gray-400 hover:text-white"}`}>
              🤖 Automático
            </button>
            <button onClick={() => setModo("manual")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${modo === "manual" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
              ✏️ Manual
            </button>
          </div>

          {tieneCalendario && (
            <button onClick={eliminarCalendario} disabled={loading}
              className="text-sm bg-red-900/30 hover:bg-red-900/50 text-red-400 font-bold px-4 py-2.5 rounded-xl transition">
              Eliminar todo
            </button>
          )}
          {tieneCalendario && (
            <button onClick={enviarNotificaciones} disabled={enviando}
              className="bg-blue-700 hover:bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">
              {enviando ? "Enviando..." : "📱 Notificar"}
            </button>
          )}
          {notifResult && <p className="text-green-400 text-sm self-center">{notifResult}</p>}

            <button onClick={() => setShowImport(true)}
              className="bg-purple-700 hover:bg-purple-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">
              📊 Importar Excel
            </button> 
        </div>
        
      </div>

      {/* MODO AUTOMÁTICO */}
      {modo === "auto" && (
        <div className="space-y-6">
          {!torneo.startDate && (
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl px-4 py-3 text-yellow-400 text-sm">
              ⚠️ El torneo no tiene fecha de inicio.
            </div>
          )}
          {torneo.matchDays.length === 0 && (
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl px-4 py-3 text-yellow-400 text-sm">
              ⚠️ No hay días de juego configurados.
            </div>
          )}
          {torneo.teams.length < 2 && (
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl px-4 py-3 text-yellow-400 text-sm">
              ⚠️ Necesitas al menos 2 equipos.
            </div>
          )}

          {puedeGenerar && !tieneCalendario && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Vista previa</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p className="text-gray-500 mb-1">Equipos</p><p className="text-white font-bold text-2xl">{numEquipos}</p></div>
                <div><p className="text-gray-500 mb-1">Jornadas</p><p className="text-green-400 font-bold text-2xl">{numJornadas}</p></div>
                <div><p className="text-gray-500 mb-1">Por jornada</p><p className="text-blue-400 font-bold text-2xl">{partidosPorJornada}</p></div>
                <div><p className="text-gray-500 mb-1">Total</p><p className="text-purple-400 font-bold text-2xl">{totalPartidos}</p></div>
              </div>
            </div>
          )}

          {puedeGenerar && (
            <button onClick={() => setConfirmar(true)} disabled={loading}
              className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">
              {tieneCalendario ? "Regenerar calendario" : "Generar calendario automático"}
            </button>
          )}

          {error && <div className="bg-red-900/20 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}
        </div>
      )}

      {/* MODO MANUAL */}
      {modo === "manual" && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-black text-white">Agregar partido</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Equipo Local</label>
              <select value={homeTeamId} onChange={e => setHomeTeamId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500">
                <option value="">Selecciona equipo local</option>
                {torneo.teams.map(t => (
                  <option key={t.id} value={t.id} disabled={t.id === awayTeamId}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Equipo Visitante</label>
              <select value={awayTeamId} onChange={e => setAwayTeamId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500">
                <option value="">Selecciona equipo visitante</option>
                {torneo.teams.map(t => (
                  <option key={t.id} value={t.id} disabled={t.id === homeTeamId}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500" />
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Hora</label>
              <input type="time" value={hora} onChange={e => setHora(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500" />
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Cancha</label>
              <div className="flex gap-3">
                {[1, 2].map(c => (
                  <button key={c} onClick={() => setCancha(c as 1 | 2)}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition border ${cancha === c ? "bg-green-600 border-green-600 text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"}`}>
                    Cancha {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Jornada (opcional)</label>
              <select value={roundId} onChange={e => setRoundId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500">
                <option value="">Nueva jornada automática</option>
                {torneo.rounds.map(r => (
                  <option key={r.id} value={r.id}>{r.name ?? `Jornada ${r.number}`}</option>
                ))}
              </select>
            </div>
          </div>

          {errorManual && <div className="bg-red-900/20 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm">{errorManual}</div>}
          {successManual && <div className="bg-green-900/20 border border-green-800 rounded-xl px-4 py-3 text-green-400 text-sm">{successManual}</div>}

          <button onClick={agregarPartidoManual} disabled={agregando}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition text-sm">
            {agregando ? "Agregando..." : "➕ Agregar partido"}
          </button>
        </div>
      )}

      {/* Modal confirmación auto */}
      {confirmar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-black text-white mb-2">
              {tieneCalendario ? "¿Regenerar calendario?" : "¿Generar calendario?"}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              {tieneCalendario
                ? "Se eliminará el calendario actual. Los resultados se perderán."
                : `Se generarán ${numJornadas} jornadas con ${totalPartidos} partidos.`}
            </p>
            <div className="flex gap-3">
              <button onClick={generarCalendario} disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition">
                {loading ? "Generando..." : "Confirmar"}
              </button>
              <button onClick={() => setConfirmar(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold py-3 rounded-xl transition">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de partidos */}
      {tieneCalendario && (
        <div className="space-y-4">
          {torneo.rounds.map((round) => (
            <div key={round.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-white font-bold">{round.name ?? `Jornada ${round.number}`}</h3>
                <span className="text-xs text-gray-500">{round.matches.length} partidos</span>
              </div>
              <div className="divide-y divide-gray-800">
                {round.matches.map((m) => (
                  <div key={m.id} className="px-6 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-white font-semibold text-sm text-right flex-1">{m.homeTeam.name}</span>
                      <span className="text-gray-500 text-xs bg-gray-800 px-3 py-1 rounded font-bold">VS</span>
                      <span className="text-white font-semibold text-sm flex-1">{m.awayTeam.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {m.cancha && <span className="bg-gray-800 px-2 py-1 rounded">C{m.cancha}</span>}
                      <span>{new Date(m.date).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })}</span>
                      <span>{new Date(m.date).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</span>
                      <button onClick={() => generarCedula(m)}
                        className="bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400 font-bold px-3 py-1 rounded-lg transition">
                        📄 Cédula
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    {showImport && (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-2xl w-full space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-white">📊 Importar Jornadas desde Excel</h3>
        <button onClick={() => { setShowImport(false); setImportRows([]); setImportMappings({}); }}
          className="text-gray-500 hover:text-white text-2xl">×</button>
      </div>

      {/* Upload */}
      {importRows.length === 0 && (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            El Excel debe tener las columnas: <span className="text-white font-mono">jornada, equipo_local, equipo_visitante, fecha, hora, cancha</span>
          </p>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-purple-700 file:text-white file:font-bold hover:file:bg-purple-600 cursor-pointer" />
        </div>
      )}

      {/* Preview y mapeo */}
      {importRows.length > 0 && (
        <div className="space-y-6">
          <p className="text-gray-400 text-sm">{importRows.length} partidos detectados</p>

          {/* Mapeo de equipos */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Verificar equipos</h4>
            {Object.entries(importMappings).map(([nombre, teamId]) => {
              const reconocido = !!teamId;
              return (
                <div key={nombre} className={`flex items-center gap-3 p-3 rounded-xl border ${reconocido ? "border-green-800 bg-green-900/10" : "border-red-800 bg-red-900/10"}`}>
                  <span className="text-sm flex-1 text-white">{nombre}</span>
                  {reconocido ? (
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-xs">✓ {torneo.teams.find(t => t.id === teamId)?.name}</span>
                      <button onClick={() => setImportMappings(prev => ({ ...prev, [nombre]: "" }))}
                        className="text-gray-500 hover:text-red-400 text-xs">cambiar</button>
                    </div>
                  ) : (
                    <select
                      value={teamId}
                      onChange={e => setImportMappings(prev => ({ ...prev, [nombre]: e.target.value }))}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-red-500"
                    >
                      <option value="">— Selecciona equipo —</option>
                      {torneo.teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>

          {/* Preview tabla */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Vista previa (primeros 5)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-800">
                    <th className="pb-2 pr-3">Jornada</th>
                    <th className="pb-2 pr-3">Local</th>
                    <th className="pb-2 pr-3">Visitante</th>
                    <th className="pb-2 pr-3">Fecha</th>
                    <th className="pb-2 pr-3">Hora</th>
                    <th className="pb-2">Cancha</th>
                  </tr>
                </thead>
                <tbody>
                  {importRows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-b border-gray-800/50 text-gray-300">
                      <td className="py-1.5 pr-3">{r.jornada}</td>
                      <td className="py-1.5 pr-3">{r.equipo_local}</td>
                      <td className="py-1.5 pr-3">{r.equipo_visitante}</td>
                      <td className="py-1.5 pr-3">{r.fecha}</td>
                      <td className="py-1.5 pr-3">{r.hora}</td>
                      <td className="py-1.5">{r.cancha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importRows.length > 5 && <p className="text-gray-600 text-xs mt-2">... y {importRows.length - 5} más</p>}
            </div>
          </div>

          {importError && <div className="bg-red-900/20 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm">{importError}</div>}
          {importSuccess && <div className="bg-green-900/20 border border-green-800 rounded-xl px-4 py-3 text-green-400 text-sm">{importSuccess}</div>}

          <div className="flex gap-3">
            <button onClick={confirmarImportacion} disabled={importando}
              className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition">
              {importando ? "Importando..." : "⬆️ Importar todo"}
            </button>
            <button onClick={() => { setImportRows([]); setImportMappings({}); }}
              className="bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold px-6 py-3 rounded-xl transition">
              Cambiar archivo
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
)}
    </div>
  );
}