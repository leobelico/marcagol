"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Team = { id: string; name: string };
type Match = { id: string; date: Date; homeTeam: Team; awayTeam: Team; status: string };
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

const DIAS_MAP: Record<string, number> = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
  THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
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
  const [enviando, setEnviando] = useState(false);        // ← aquí adentro
  const [notifResult, setNotifResult] = useState(""); 
  const tieneCalendario = torneo.rounds.length > 0;
  const puedeGenerar = torneo.teams.length >= 2 && torneo.matchDays.length > 0 && torneo.startDate;

  // Calcular preview del calendario
  const numEquipos = torneo.teams.length;
  const numJornadas = torneo.roundTrip
    ? (numEquipos % 2 === 0 ? (numEquipos - 1) * 2 : numEquipos * 2)
    : (numEquipos % 2 === 0 ? numEquipos - 1 : numEquipos);
  const partidosPorJornada = Math.floor(numEquipos / 2);
  const totalPartidos = numJornadas * partidosPorJornada;

  async function generarCalendario() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/admin/torneos/${torneo.id}/calendario/generar`, {
      method: "POST",
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Error al generar el calendario");
      setLoading(false);
      return;
    }

    setConfirmar(false);
    setLoading(false);
    router.refresh();
  }
async function generarCedula(match: Match) {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const home = match.homeTeam.name;
  const away = match.awayTeam.name;

  const pageW = doc.internal.pageSize.getWidth();

  // ───────────────── HEADER ─────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CÉDULA ARBITRAL - TERRITORIO RINOS", pageW / 2, 15, {
    align: "center",
  });

  // Logo (si quieres después puedes meter base64 o URL)
  doc.setFontSize(10);

  // ───────────────── DATOS GENERALES ─────────────────
  doc.setFont("helvetica", "normal");
  doc.text("Árbitro: ____________________", 20, 30);
  doc.text("Categoría: ____________________", 110, 30);
  doc.text("Rama: ____________________", 20, 38);

  doc.text("Día: ____________________", 20, 46);
  doc.text("Hora: ____________________", 110, 46);
  doc.text("Año: ____________________", 20, 54);

  // ───────────────── EQUIPO A ─────────────────
  doc.setFillColor(0, 80, 0);
  doc.rect(20, 62, 80, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(`Equipo: ${home}`, 22, 66);

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  let yA = 72;
  for (let i = 0; i < 10; i++) {
    doc.text(`# ___   Jugador ________________   G ____   E ____`, 20, yA);
    yA += 6;
  }

  // ───────────────── EQUIPO B ─────────────────
  doc.setFillColor(0, 80, 0);
  doc.rect(110, 62, 80, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(`Equipo: ${away}`, 112, 66);

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  let yB = 72;
  for (let i = 0; i < 10; i++) {
    doc.text(`# ____   Jugador __________________   G ____   E ____`, 110, yB);
    yB += 6;
  }

  // ───────────────── MARCADOR FINAL ─────────────────
  doc.setFillColor(0, 80, 0);
  doc.rect(10, 140, 190, 8, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("MARCADOR FINAL", pageW / 2, 146, { align: "center" });

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  doc.text("Equipo A: ____________", 20, 158);
  doc.text("Equipo B: ____________", 120, 158);

  // ───────────────── TARJETAS ─────────────────
  doc.text("Equipo A - Amarillas: ____________", 20, 170);
  doc.text("Equipo B - Amarillas: ____________", 20, 178);

  doc.text("Tarjetas Rojas: ____________", 20, 190);
  doc.text("Autogoles: ____________", 20, 198);

  // ───────────────── CAPITANES Y FIRMA ─────────────────
  doc.text("Capitán Equipo A: ____________________", 20, 212);
  doc.text("Capitán Equipo B: ____________________", 20, 220);

  doc.text("Firma Árbitro: ____________________", 20, 235);

  doc.save(`Cedula_${home}_vs_${away}.pdf`);
}
  async function eliminarCalendario() {
    if (!confirm("¿Eliminar todo el calendario? Esta acción no se puede deshacer.")) return;
    setLoading(true);
    await fetch(`/api/admin/torneos/${torneo.id}/calendario/generar`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
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

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Calendario</h2>
          <p className="text-gray-500 text-sm mt-1">
            {tieneCalendario ? `${torneo.rounds.length} jornadas generadas` : "Sin calendario aún"}
          </p>
        </div>
        <div className="flex gap-3">
          {tieneCalendario && (
            <button onClick={eliminarCalendario} disabled={loading}
              className="text-sm bg-red-900/30 hover:bg-red-900/50 text-red-400 font-bold px-4 py-2.5 rounded-xl transition">
              Eliminar calendario
            </button>
          )}
          {puedeGenerar && (
            <button onClick={() => setConfirmar(true)} disabled={loading}
              className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">
              {tieneCalendario ? "Regenerar calendario" : "Generar calendario"}
            </button>
          )}
          {tieneCalendario && (
            <button onClick={enviarNotificaciones} disabled={enviando}
                className="bg-blue-700 hover:bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">
                {enviando ? "Enviando..." : "📱 Notificar equipos"}
            </button>
            )}
            {notifResult && <p className="text-green-400 text-sm">{notifResult}</p>}
        </div>
      </div>

      {/* Alertas de configuración faltante */}
      {!torneo.startDate && (
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl px-4 py-3 text-yellow-400 text-sm">
          ⚠️ El torneo no tiene fecha de inicio. Edita la configuración del torneo primero.
        </div>
      )}
      {torneo.matchDays.length === 0 && (
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl px-4 py-3 text-yellow-400 text-sm">
          ⚠️ No hay días de juego configurados.
        </div>
      )}
      {torneo.teams.length < 2 && (
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl px-4 py-3 text-yellow-400 text-sm">
          ⚠️ Necesitas al menos 2 equipos para generar el calendario.
        </div>
      )}

      {/* Preview antes de generar */}
      {puedeGenerar && !tieneCalendario && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Vista previa</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Equipos</p>
              <p className="text-white font-bold text-2xl">{numEquipos}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Jornadas</p>
              <p className="text-green-400 font-bold text-2xl">{numJornadas}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Partidos por jornada</p>
              <p className="text-blue-400 font-bold text-2xl">{partidosPorJornada}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Total partidos</p>
              <p className="text-purple-400 font-bold text-2xl">{totalPartidos}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-800 text-sm text-gray-400">
            <span className="mr-4">📅 Inicio: {new Date(torneo.startDate!).toLocaleDateString("es-MX")}</span>
            <span className="mr-4">📆 Días: {torneo.matchDays.map(d => DIAS_LABEL[d]).join(", ")}</span>
            <span>🔄 Formato: {torneo.roundTrip ? "Ida y vuelta" : "Solo ida"}</span>
          </div>
        </div>
      )}

      {/* Modal confirmación */}
      {confirmar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-black text-white mb-2">
              {tieneCalendario ? "¿Regenerar calendario?" : "¿Generar calendario?"}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              {tieneCalendario
                ? "Se eliminará el calendario actual y se generará uno nuevo. Los resultados ya cargados se perderán."
                : `Se generarán ${numJornadas} jornadas con ${totalPartidos} partidos en total.`}
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

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {/* Calendario generado */}
      {tieneCalendario && (
        <div className="space-y-4">
          {torneo.rounds.map((round) => (
            <div key={round.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-white font-bold">
                  {round.name ?? `Jornada ${round.number}`}
                </h3>
                <span className="text-xs text-gray-500">{round.matches.length} partidos</span>
              </div>
              <div className="divide-y divide-gray-800">
                {round.matches.map((m) => (
                  
                  <div key={m.id} className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-white font-semibold text-sm text-right flex-1">{m.homeTeam.name}</span>
                      <span className="text-gray-500 text-xs bg-gray-800 px-3 py-1 rounded font-bold">VS</span>
                      <span className="text-white font-semibold text-sm flex-1">{m.awayTeam.name}</span>
                      <button
                      onClick={() => generarCedula(m)}
                      className="text-xs bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400 font-bold px-3 py-1 rounded-lg transition"
                    >
                      📄 Cédula
                    </button>
                    </div>
                    <span className="text-gray-500 text-xs ml-4">
                      {new Date(m.date).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}