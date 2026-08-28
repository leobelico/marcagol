"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
type Player = { id: string; name: string; number: number | null; position: string | null; suspendedUntil?: number | null; };
type Team = { id: string; name: string; players: Player[]; disqualified?: boolean | null };
type Match = { id: string; date: Date; homeTeam: Team; awayTeam: Team; status: string; cancha?: number | null; homeScore?: number | null; awayScore?: number | null; bracketOrder?: number | null; };
type Round = { id: string; number: number; name: string | null; matches: Match[]; bracketStage?: number | null; bracketLabel?: string | null; };
type Torneo = {
  id: string;
  name: string;
  teams: Team[];
  rounds: Round[];
  startDate: Date | null;
  matchDays: string[];
  matchesPerDay: number;
  roundTrip: boolean;
   logo?: string | null;
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
const [cancha, setCancha] = useState<1 | 2 | 3>(1);
  const [roundId, setRoundId] = useState("");
  const [agregando, setAgregando] = useState(false);
  const [errorManual, setErrorManual] = useState("");
  const [successManual, setSuccessManual] = useState("");
  // Estado liguilla
  const [showLiguilla, setShowLiguilla] = useState(false);
const [numLiguilla, setNumLiguilla] = useState<number>(4);
  const [bracketLabel, setBracketLabel] = useState("Cuartos de Final");
const [liguillaPares, setLiguillaPares] = useState <
    { homeTeamId: string; awayTeamId: string; homeTeamName: string; awayTeamName: string; fecha: string; hora: string; cancha: 1 | 2 | 3; yaExiste: boolean }[]
  >([]);
  const [creandoLiguilla, setCreandoLiguilla] = useState(false);
  const [errorLiguilla, setErrorLiguilla] = useState("");
  const [successLiguilla, setSuccessLiguilla] = useState("");
const [showDescalificar, setShowDescalificar] = useState(false);
const [descalificandoId, setDescalificandoId] = useState<string | null>(null);
  const tieneCalendario = torneo.rounds.length > 0;
  const puedeGenerar = torneo.teams.length >= 2 && torneo.matchDays.length > 0 && torneo.startDate;
const [showSiguienteRonda, setShowSiguienteRonda] = useState(false);
  const [pasoSiguiente, setPasoSiguiente] = useState<"empates" | "pares">("empates");
  const [empatesPendientes, setEmpatesPendientes] = useState<Match[]>([]);
  const [ganadoresEmpate, setGanadoresEmpate] = useState<Record<string, string>>({});
  const [siguienteLabel, setSiguienteLabel] = useState("");
  const [siguientePares, setSiguientePares] = useState <
    { homeTeamId: string; awayTeamId: string; homeTeamName: string; awayTeamName: string; fecha: string; hora: string; cancha: 1 | 2 | 3 }[]
  >([]);
  const [generandoSiguiente, setGenerandoSiguiente] = useState(false);
  const [errorSiguiente, setErrorSiguiente] = useState("");

  // =========================
  // OPCIONES DE GENERACIÓN (hora inicio + preferencias)
  // =========================

  const [horaInicioGen, setHoraInicioGen] = useState("18:00");

  const [preferenciasGen, setPreferenciasGen] = useState<
    { teamId: string; day: string }[]
  >([]);

  const [conflictosGen, setConflictosGen] = useState<
    { homeTeam: string; awayTeam: string; motivo: string }[]
  >([]);

  function agregarPreferencia() {
    setPreferenciasGen((prev) => [
      ...prev,
      { teamId: "", day: torneo.matchDays[0] || "MONDAY" },
    ]);
  }

  function actualizarPreferencia(
    index: number,
    campo: "teamId" | "day",
    valor: string
  ) {
    setPreferenciasGen((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [campo]: valor } : p))
    );
  }

  function quitarPreferencia(index: number) {
    setPreferenciasGen((prev) => prev.filter((_, i) => i !== index));
  }

  const numEquipos = torneo.teams.length;
  const numJornadas = torneo.roundTrip
    ? (numEquipos % 2 === 0 ? (numEquipos - 1) * 2 : numEquipos * 2)
    : (numEquipos % 2 === 0 ? numEquipos - 1 : numEquipos);
  const partidosPorJornada = Math.floor(numEquipos / 2);
  const totalPartidos = numJornadas * partidosPorJornada;
const rondasBracket = torneo.rounds.filter((r) => r.bracketStage != null);
  const ultimaRondaBracket = rondasBracket.length > 0
    ? rondasBracket.reduce((a, b) => ((a.bracketStage ?? 0) > (b.bracketStage ?? 0) ? a : b))
    : null;
  const bracketCompleta = !!ultimaRondaBracket && ultimaRondaBracket.matches.length > 0 && ultimaRondaBracket.matches.every((m) => m.status === "FINISHED");
  const esFinalBracket = !!ultimaRondaBracket && ultimaRondaBracket.matches.length === 1;
  async function generarCalendario() {
    setLoading(true);
    setError("");
    setConflictosGen([]);

    const res = await fetch(`/api/admin/torneos/${torneo.id}/calendario/generar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        horaInicio: horaInicioGen,
        preferencias: preferenciasGen.filter((p) => p.teamId),
      }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error || "Error al generar"); setLoading(false); return; }
    setConfirmar(false);
    setLoading(false);

    if (json.conflictos && json.conflictos.length > 0) {
      setConflictosGen(json.conflictos);
    }

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
function existeCruce(teamAId: string, teamBId: string): boolean {
    return torneo.rounds.some((r) =>
      r.matches.some(
        (m) =>
          (m.homeTeam.id === teamAId && m.awayTeam.id === teamBId) ||
          (m.homeTeam.id === teamBId && m.awayTeam.id === teamAId)
      )
    );
  }
async function agregarPartidoManual(forzar = false) {
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
      body: JSON.stringify({
        homeTeamId, awayTeamId, date: dateTime, cancha, roundId: roundId || null,
        confirmarRepetido: forzar,
      }),
    });
    const json = await res.json();

    if (!res.ok) {
      if (json.requiereConfirmacion) {
        setAgregando(false);
        const confirmado = window.confirm(`${json.error} ¿Seguro que quieres generar otro partido entre ellos?`);
        if (confirmado) {
          agregarPartidoManual(true); // reintenta ya confirmado
        }
        return;
      }
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
function calcularStandings() {
    const stats: Record<string, { team: Team; pts: number; gf: number; ga: number }> = {};
    torneo.teams
      .filter((t) => !t.disqualified)
      .forEach((t) => { stats[t.id] = { team: t, pts: 0, gf: 0, ga: 0 }; });

    torneo.rounds
      .filter((r) => r.bracketStage == null)   // ← esto excluye la liguilla
      .forEach((r) => {
        r.matches.forEach((m) => {
          if (m.status !== "FINISHED") return;
          const hs = m.homeScore ?? 0;
          const as = m.awayScore ?? 0;
          if (stats[m.homeTeam.id]) {
            stats[m.homeTeam.id].gf += hs;
            stats[m.homeTeam.id].ga += as;
            stats[m.homeTeam.id].pts += hs > as ? 3 : hs === as ? 1 : 0;
          }
          if (stats[m.awayTeam.id]) {
            stats[m.awayTeam.id].gf += as;
            stats[m.awayTeam.id].ga += hs;
            stats[m.awayTeam.id].pts += as > hs ? 3 : hs === as ? 1 : 0;
          }
        });
      });

    return Object.values(stats).sort(
      (a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf
    );
  }

  function generarLiguilla() {
    setErrorLiguilla("");
    const standings = calcularStandings();
    const clasificados = standings.slice(0, numLiguilla).map((s) => s.team);

    if (clasificados.length < 2) {
      setErrorLiguilla("Necesitas al menos 2 equipos clasificados (recuerda que los equipos descalificados no cuentan)");
      return;
    }

    const pares = [];
    const mitad = Math.floor(clasificados.length / 2);
    for (let i = 0; i < mitad; i++) {
      const home = clasificados[i];
      const away = clasificados[clasificados.length - 1 - i];
   pares.push({
        homeTeamId: home.id,
        awayTeamId: away.id,
        homeTeamName: home.name,
        awayTeamName: away.name,
        fecha: "",
        hora: "",
        cancha: 1 as 1 | 2 | 3,
        yaExiste: existeCruce(home.id, away.id),
      });
    }
    setLiguillaPares(pares);
  }
function mexicoLocalToISOString(fechaStr: string, horaStr: string): string {
  return new Date(`${fechaStr}T${horaStr}:00-06:00`).toISOString();
}
  function actualizarParLiguilla(i: number, campo: "fecha" | "hora" | "cancha", valor: any) {
    setLiguillaPares((prev) => prev.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p)));
  }

  async function crearLiguilla() {
    setErrorLiguilla("");
    setSuccessLiguilla("");
    const incompletos = liguillaPares.filter((p) => !p.fecha || !p.hora);
    if (incompletos.length > 0) {
      setErrorLiguilla("Completa fecha y hora de todos los cruces");
      return;
    }
    setCreandoLiguilla(true);
    const res = await fetch(`/api/admin/torneos/${torneo.id}/calendario/bracket`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bracketLabel,
        pares: liguillaPares.map((p) => ({
          homeTeamId: p.homeTeamId,
          awayTeamId: p.awayTeamId,
          fecha: p.fecha,
          hora: p.hora,
          date: mexicoLocalToISOString(p.fecha, p.hora),
          cancha: p.cancha,
        })),
      }),
    });
    const json = await res.json();
    setCreandoLiguilla(false);

    if (!res.ok) {
      setErrorLiguilla(json.error || "Error al crear la liguilla");
      return;
    }

    setSuccessLiguilla(`✅ ${bracketLabel} creada con ${liguillaPares.length} partidos`);
    setLiguillaPares([]);
    setShowLiguilla(false);
    router.refresh();
  }

  function abrirSiguienteRonda() {
    if (!ultimaRondaBracket) return;
    setErrorSiguiente("");
    const matchesOrdenados = [...ultimaRondaBracket.matches].sort(
      (a, b) => (a.bracketOrder ?? 0) - (b.bracketOrder ?? 0)
    );
    const empates = matchesOrdenados.filter((m) => (m.homeScore ?? 0) === (m.awayScore ?? 0));
    setEmpatesPendientes(empates);
    setGanadoresEmpate({});
    if (empates.length > 0) {
      setPasoSiguiente("empates");
    } else {
      prepararParesSiguienteRonda(matchesOrdenados, {});
    }
    setShowSiguienteRonda(true);
  }

function prepararParesSiguienteRonda(matchesOrdenados: Match[], empates: Record<string, string>) {
    const ganadores = matchesOrdenados.map((m) => {
      if ((m.homeScore ?? 0) === (m.awayScore ?? 0)) {
        const ganadorId = empates[m.id];
        return ganadorId === m.awayTeam.id ? m.awayTeam : m.homeTeam;
      }
      return (m.homeScore ?? 0) > (m.awayScore ?? 0) ? m.homeTeam : m.awayTeam;
    });

    // Reordena a los ganadores según su posición en la tabla general
    const standings = calcularStandings();
    const posicionPorEquipo: Record<string, number> = {};
    standings.forEach((s, idx) => { posicionPorEquipo[s.team.id] = idx; });

    const ganadoresOrdenados = [...ganadores].sort(
      (a, b) => (posicionPorEquipo[a.id] ?? 999) - (posicionPorEquipo[b.id] ?? 999)
    );

    // Empareja mejor vs peor: 1° vs último, 2° vs penúltimo, etc.
    const pares = [];
    const mitad = Math.floor(ganadoresOrdenados.length / 2);
    for (let i = 0; i < mitad; i++) {
      const home = ganadoresOrdenados[i];
      const away = ganadoresOrdenados[ganadoresOrdenados.length - 1 - i];
      pares.push({
        homeTeamId: home.id,
        awayTeamId: away.id,
        homeTeamName: home.name,
        awayTeamName: away.name,
        fecha: "",
        hora: "",
        cancha: 1 as 1 | 2 | 3,
      });
    }
    setSiguientePares(pares);
    setSiguienteLabel(
      pares.length === 1 ? "Final" : pares.length === 2 ? "Semifinal" : pares.length === 4 ? "Cuartos de Final" : `Ronda de ${pares.length * 2}`
    );
    setPasoSiguiente("pares");
  }

  function confirmarEmpates() {
    if (!ultimaRondaBracket) return;
    const faltan = empatesPendientes.filter((m) => !ganadoresEmpate[m.id]);
    if (faltan.length > 0) {
      setErrorSiguiente("Selecciona quién avanza en todos los empates");
      return;
    }
    setErrorSiguiente("");
    const matchesOrdenados = [...ultimaRondaBracket.matches].sort(
      (a, b) => (a.bracketOrder ?? 0) - (b.bracketOrder ?? 0)
    );
    prepararParesSiguienteRonda(matchesOrdenados, ganadoresEmpate);
  }

  function actualizarParSiguiente(i: number, campo: "fecha" | "hora" | "cancha", valor: any) {
    setSiguientePares((prev) => prev.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p)));
  }

  async function crearSiguienteRonda() {
    setErrorSiguiente("");
    const incompletos = siguientePares.filter((p) => !p.fecha || !p.hora);
    if (incompletos.length > 0) {
      setErrorSiguiente("Completa fecha y hora de todos los cruces");
      return;
    }
    setGenerandoSiguiente(true);
    const res = await fetch(`/api/admin/torneos/${torneo.id}/calendario/bracket`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bracketLabel: siguienteLabel,
        pares: siguientePares.map((p) => ({
          homeTeamId: p.homeTeamId,
          awayTeamId: p.awayTeamId,
          fecha: p.fecha,
          hora: p.hora,
          date: mexicoLocalToISOString(p.fecha, p.hora),
          cancha: p.cancha,
        })),
      }),
    });
    const json = await res.json();
    setGenerandoSiguiente(false);
    if (!res.ok) {
      setErrorSiguiente(json.error || "Error al generar la siguiente ronda");
      return;
    }
    setShowSiguienteRonda(false);
    router.refresh();
  }
async function toggleDescalificado(teamId: string, actual: boolean) {
  setDescalificandoId(teamId);
  try {
    const res = await fetch(`/api/admin/torneos/${torneo.id}/equipos/${teamId}/descalificar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disqualified: !actual }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(json.error || "Error al actualizar el equipo");
    } else {
      router.refresh();
    }
  } finally {
    setDescalificandoId(null);
  }
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
  const homePlayers = match.homeTeam.players ?? [];
  const awayPlayers = match.awayTeam.players ?? [];
  const pageW = doc.internal.pageSize.getWidth();

  // =========================
  // CARGAR LOGO DEL TORNEO
  // =========================
  let logoData: string | null = null;
  let logoFormato: "JPEG" | "PNG" = "JPEG";

  if (torneo.logo) {
    try {
      const response = await fetch(torneo.logo);

      if (response.ok) {
        const blob = await response.blob();

        logoFormato = blob.type === "image/png" ? "PNG" : "JPEG";

        logoData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  // =========================
  // ENCABEZADO
  // =========================
  doc.setFillColor(0, 80, 0);
  doc.rect(0, 0, pageW, 22, "F");
doc.setTextColor(255, 255, 255);

  // Logo
  if (logoData) {
    doc.addImage(logoData, logoFormato, 4, 3, 16, 16);
  }

doc.setFont("helvetica", "bold");
doc.setFontSize(16);
doc.text("CÉDULA ARBITRAL", pageW / 2, 9, {
  align: "center",
});

// NOMBRE DE LA LIGA / TORNEO
doc.setFont("helvetica", "bold");
doc.setFontSize(10);
doc.text(
  torneo.name.toUpperCase(),
  pageW / 2,
  15,
  {
    align: "center",
  }
);

// FECHA
doc.setFont("helvetica", "normal");
doc.setFontSize(8);
doc.text(
  `Fecha: ${new Date(match.date).toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })}`,
  pageW / 2,
  20,
  {
    align: "center",
  }
);
  // =========================
  // INFO PARTIDO
  // =========================
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text(`Árbitro: ____________________`, 15, 30);
  doc.text(`Cancha: ${match.cancha ?? "___"}`, 120, 30);
  doc.text(
    `Hora: ${new Date(match.date).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    165,
    30
  );

  doc.setDrawColor(200, 200, 200);
  doc.line(15, 34, pageW - 15, 34);

  const colLeft = 15;
  const colRight = pageW / 2 + 5;
  const colWidth = pageW / 2 - 20;

  function dibujarEquipo(
    nombre: string,
    jugadores: Player[],
    x: number,
    startY: number
  ) {
    doc.setFillColor(0, 80, 0);
    doc.rect(x, startY, colWidth, 8, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(nombre.toUpperCase(), x + colWidth / 2, startY + 5.5, {
      align: "center",
    });

    let y = startY + 12;

    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("#", x + 2, y);
    doc.text("Nombre", x + 10, y);
    doc.text("Pos", x + colWidth - 22, y);
    doc.text("G", x + colWidth - 10, y);
    doc.text("TA", x + colWidth - 5, y);

    doc.setDrawColor(220, 220, 220);
    doc.line(x, y + 2, x + colWidth, y + 2);

    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);

    const jugadoresOrdenados = [...jugadores].sort(
      (a, b) => (a.number ?? 99) - (b.number ?? 99)
    );

    const maxJugadores = Math.max(jugadoresOrdenados.length, 15);

    for (let i = 0; i < maxJugadores; i++) {
      const j = jugadoresOrdenados[i];
      const rowY = y + i * 7;

      if (i % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(x, rowY - 4, colWidth, 7, "F");
      }

      if (j) {
        doc.setTextColor(0, 0, 0);
        doc.text(j.number != null ? String(j.number) : "-", x + 2, rowY);

        const nombreCorto =
          j.name.length > 22 ? j.name.substring(0, 20) + "…" : j.name;

        doc.text(nombreCorto, x + 10, rowY);

        if (j.position) {
          const pos =
            j.position === "Portero"
              ? "POR"
              : j.position === "Defensa"
              ? "DEF"
              : j.position === "Mediocampista"
              ? "MED"
              : "DEL";

          doc.text(pos, x + colWidth - 22, rowY);
        }
      } else {
        doc.setTextColor(180, 180, 180);
        doc.text("___", x + 2, rowY);
        doc.text("_______________________", x + 10, rowY);
      }

      doc.setTextColor(0, 0, 0);
      doc.text("__", x + colWidth - 10, rowY);
      doc.text("__", x + colWidth - 5, rowY);
    }

    const finalY = y + maxJugadores * 7;

    doc.setFillColor(240, 240, 240);
    doc.rect(x, finalY, colWidth, 10, "F");

    doc.setDrawColor(180, 180, 180);
    doc.rect(x, finalY, colWidth, 10);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("GOLES:", x + 3, finalY + 6.5);
    doc.text("_____", x + 22, finalY + 6.5);

    return finalY + 14;
  }

  const endY = dibujarEquipo(home, homePlayers, colLeft, 38);
  dibujarEquipo(away, awayPlayers, colRight, 38);

  doc.setDrawColor(220, 220, 220);
  doc.line(pageW / 2, 38, pageW / 2, endY - 14);

  doc.line(15, endY + 5, 85, endY + 5);
  doc.text("Firma equipo local", 50, endY + 10, { align: "center" });

  doc.line(pageW - 85, endY + 5, pageW - 15, endY + 5);
  doc.text("Firma equipo visitante", pageW - 50, endY + 10, {
    align: "center",
  });

  doc.line(pageW / 2 - 35, endY + 20, pageW / 2 + 35, endY + 20);
  doc.text("Firma árbitro", pageW / 2, endY + 25, { align: "center" });

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
            <button onClick={() => setShowLiguilla(true)}
              className="bg-yellow-700 hover:bg-yellow-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">
              🏆 Crear Liguilla
            </button>
            {bracketCompleta && !esFinalBracket && (
              <button onClick={abrirSiguienteRonda}
                className="bg-green-700 hover:bg-green-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">
                ▶️ Generar Siguiente Ronda
              </button>
            )}
            {bracketCompleta && esFinalBracket && (
              <span className="bg-yellow-900/30 text-yellow-400 font-bold px-5 py-2.5 rounded-xl text-sm flex items-center">
                🏆 Torneo finalizado
              </span>
            )}
            <button onClick={() => setShowDescalificar(true)}
            className="bg-red-800 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">
            🚫 Descalificar equipos
          </button>
        </div>
        
      </div>

      {/* Conflictos de la última generación */}
      {conflictosGen.length > 0 && (
        <div className="bg-orange-900/20 border border-orange-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-orange-400 font-bold text-sm">
              ⚠️ {conflictosGen.length} partido(s) no se pudieron agendar automáticamente
            </h3>
            <button
              onClick={() => setConflictosGen([])}
              className="text-gray-500 hover:text-gray-300 text-sm"
            >
              ✕
            </button>
          </div>
          <p className="text-orange-300 text-xs">
            Agrégalos manualmente desde la pestaña "✏️ Manual".
          </p>
          <ul className="space-y-1 text-sm text-orange-200">
            {conflictosGen.map((c, i) => (
              <li key={i}>
                • {c.homeTeam} vs {c.awayTeam} — {c.motivo}
              </li>
            ))}
          </ul>
        </div>
      )}

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
                {[1, 2, 3].map(c => (
                  <button key={c} onClick={() => setCancha(c as 1 | 2 | 3)}
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

          <button onClick={() => agregarPartidoManual()} disabled={agregando}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition text-sm">
            {agregando ? "Agregando..." : "➕ Agregar partido"}
          </button>
        </div>
      )}

      {/* Modal confirmación auto (hora inicio + preferencias) */}
      {confirmar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-xl w-full space-y-6">
            <h3 className="text-xl font-black text-white mb-2">
              {tieneCalendario ? "¿Regenerar calendario?" : "¿Generar calendario?"}
            </h3>
            <p className="text-gray-400 text-sm">
              {tieneCalendario
                ? "Se eliminará el calendario actual. Los resultados se perderán."
                : `Se generarán ${numJornadas} jornadas con ${totalPartidos} partidos.`}
            </p>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">
                Hora de inicio del primer partido del día
              </label>
              <input
                type="time"
                value={horaInicioGen}
                onChange={(e) => setHoraInicioGen(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
              />
              <p className="text-gray-500 text-xs mt-1">
                Los siguientes partidos del día se acomodan uno tras otro según la duración de partido configurada, repartidos en 3 canchas.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-400 uppercase tracking-widest">
                  ¿Algún equipo tiene preferencia de día?
                </label>
                <button
                  onClick={agregarPreferencia}
                  className="text-xs bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 font-bold px-3 py-1.5 rounded-lg transition"
                >
                  + Agregar preferencia
                </button>
              </div>

              {preferenciasGen.length === 0 && (
                <p className="text-gray-600 text-xs">
                  Ninguna configurada. Solo agrega si un equipo pagó o pidió jugar siempre el mismo día.
                </p>
              )}

              <div className="space-y-2">
                {preferenciasGen.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={p.teamId}
                      onChange={(e) =>
                        actualizarPreferencia(i, "teamId", e.target.value)
                      }
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Selecciona equipo</option>
                      {torneo.teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={p.day}
                      onChange={(e) =>
                        actualizarPreferencia(i, "day", e.target.value)
                      }
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      {torneo.matchDays.map((d) => (
                        <option key={d} value={d}>
                          {DIAS_LABEL[d] ?? d}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => quitarPreferencia(i)}
                      className="text-gray-500 hover:text-red-400 text-sm px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

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
          <span>{new Date(m.date).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short", timeZone: "America/Mexico_City" })}</span>
            <span className="bg-green-900/40 border border-green-700 text-green-300 font-bold text-sm px-2.5 py-1 rounded-lg tracking-wide">
              🕒 {new Date(m.date).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" })}
            </span>
            <button onClick={() => generarCedula(m)}
                    className="bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400 font-bold px-3 py-1 rounded-lg transition">
                    📄 Cédula
                  </button>
            
                  {/* NUEVO: Mover jornada */}
                  <select
                    defaultValue=""
                    onChange={async (e) => {
                      const targetRoundId = e.target.value;
                      if (!targetRoundId) return;
                      const res = await fetch(`/api/admin/torneos/${torneo.id}/calendario/${m.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ targetRoundId }),
                      });
                      const json = await res.json();
                      if (!res.ok) alert(json.error);
                      else router.refresh();
                      e.target.value = "";
                    }}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-gray-400 text-xs focus:outline-none"
                  >
                    <option value="">↕ Mover a...</option>
                    {torneo.rounds
                      .filter((r) => r.id !== round.id)
                      .map((r) => (
                        <option key={r.id} value={r.id}>{r.name ?? `Jornada ${r.number}`}</option>
                      ))}
                  </select>

                  {/* NUEVO: Eliminar partido */}
                  <button
                    onClick={async () => {
                      if (!confirm(`¿Eliminar ${m.homeTeam.name} vs ${m.awayTeam.name}?`)) return;
                      await fetch(`/api/admin/torneos/${torneo.id}/calendario/${m.id}`, { method: "DELETE" });
                      router.refresh();
                    }}
                    className="bg-red-900/30 hover:bg-red-900/50 text-red-400 font-bold px-3 py-1 rounded-lg transition">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear Liguilla - independiente */}
      {showLiguilla && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-2xl w-full space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white">🏆 Crear Liguilla</h3>
              <button onClick={() => { setShowLiguilla(false); setLiguillaPares([]); setErrorLiguilla(""); }}
                className="text-gray-500 hover:text-white text-2xl">×</button>
            </div>

   {liguillaPares.length === 0 && (
              <div className="space-y-4">
                <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">
                  Nombre de la fase
                </label>
                <input type="text" value={bracketLabel} onChange={(e) => setBracketLabel(e.target.value)}
                  placeholder="Ej. Cuartos de Final"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500" />

                <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">
                  ¿Cuántos equipos entran a la liguilla?
                </label>
                <input type="number" min={2} max={torneo.teams.length} value={numLiguilla}
                  onChange={(e) => setNumLiguilla(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500" />
                <p className="text-gray-500 text-xs">
                  Se tomarán los primeros {numLiguilla} lugares de la tabla actual y se enfrentarán 1° vs último, 2° vs penúltimo, etc.
                </p>
                {errorLiguilla && <div className="bg-red-900/20 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm">{errorLiguilla}</div>}
                <button onClick={generarLiguilla}
                  className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-6 py-2.5 rounded-xl transition text-sm">
                  Generar cruces
                </button>
              </div>
            )}

            {liguillaPares.length > 0 && (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">Define fecha, hora y cancha de cada cruce:</p>
                {liguillaPares.map((p, i) => (
                  <div key={i} className="bg-gray-800/50 border border-gray-800 rounded-xl p-4 space-y-3">
                  <p className="text-white font-semibold text-sm text-center">
                      {p.homeTeamName} <span className="text-gray-500">vs</span> {p.awayTeamName}
                    </p>
                    {p.yaExiste && (
                      <p className="text-yellow-400 text-xs text-center bg-yellow-900/20 border border-yellow-800 rounded-lg py-1.5 px-2">
                        ⚠️ Este cruce ya se jugó anteriormente
                      </p>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      <input type="date" value={p.fecha}
                        onChange={(e) => actualizarParLiguilla(i, "fecha", e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500" />
                      <input type="time" value={p.hora}
                        onChange={(e) => actualizarParLiguilla(i, "hora", e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500" />
                    <select value={p.cancha}
                        onChange={(e) => actualizarParLiguilla(i, "cancha", Number(e.target.value) as 1 | 2 | 3)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500">
                        <option value={1}>Cancha 1</option>
                        <option value={2}>Cancha 2</option>
                        <option value={3}>Cancha 3</option>
                      </select>
                    </div>
                  </div>
                ))}

                {errorLiguilla && <div className="bg-red-900/20 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm">{errorLiguilla}</div>}
                {successLiguilla && <div className="bg-green-900/20 border border-green-800 rounded-xl px-4 py-3 text-green-400 text-sm">{successLiguilla}</div>}

                <div className="flex gap-3">
                  <button onClick={crearLiguilla} disabled={creandoLiguilla}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition">
                    {creandoLiguilla ? "Creando..." : "Crear partidos de liguilla"}
                  </button>
                  <button onClick={() => setLiguillaPares([])}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold px-6 py-3 rounded-xl transition">
                    Volver
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Descalificar equipos - independiente */}
      {showDescalificar && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white">🚫 Descalificar equipos</h3>
              <button onClick={() => setShowDescalificar(false)}
                className="text-gray-500 hover:text-white text-2xl">×</button>
            </div>
            <p className="text-gray-400 text-sm">
              Un equipo descalificado no cuenta en la tabla de posiciones ni puede ser convocado a una liguilla nueva. Sus partidos ya jugados no se borran.
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {torneo.teams.map((t) => (
                <div key={t.id} className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${t.disqualified ? "border-red-800 bg-red-900/10" : "border-gray-800 bg-gray-800/30"}`}>
                  <span className={`text-sm font-semibold ${t.disqualified ? "text-red-400 line-through" : "text-white"}`}>
                    {t.name}
                  </span>
                  <button
                    onClick={() => toggleDescalificado(t.id, !!t.disqualified)}
                    disabled={descalificandoId === t.id}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50 ${t.disqualified ? "bg-green-900/30 hover:bg-green-900/50 text-green-400" : "bg-red-900/30 hover:bg-red-900/50 text-red-400"}`}
                  >
                    {descalificandoId === t.id ? "..." : t.disqualified ? "Reactivar" : "Descalificar"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Importar Excel - independiente */}
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

      {/* Modal Generar Siguiente Ronda - independiente */}
      {showSiguienteRonda && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-2xl w-full space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white">▶️ Generar Siguiente Ronda</h3>
              <button onClick={() => setShowSiguienteRonda(false)}
                className="text-gray-500 hover:text-white text-2xl">×</button>
            </div>

            {pasoSiguiente === "empates" && (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">Estos cruces empataron — selecciona quién avanza:</p>
                {empatesPendientes.map((m) => (
                  <div key={m.id} className="bg-gray-800/50 border border-gray-800 rounded-xl p-4 space-y-2">
                    <p className="text-white font-semibold text-sm text-center mb-2">
                      {m.homeTeam.name} {m.homeScore} - {m.awayScore} {m.awayTeam.name}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setGanadoresEmpate((prev) => ({ ...prev, [m.id]: m.homeTeam.id }))}
                        className={`py-2.5 rounded-xl font-bold text-sm transition border ${ganadoresEmpate[m.id] === m.homeTeam.id ? "bg-green-600 border-green-600 text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"}`}>
                        {m.homeTeam.name}
                      </button>
                      <button
                        onClick={() => setGanadoresEmpate((prev) => ({ ...prev, [m.id]: m.awayTeam.id }))}
                        className={`py-2.5 rounded-xl font-bold text-sm transition border ${ganadoresEmpate[m.id] === m.awayTeam.id ? "bg-green-600 border-green-600 text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"}`}>
                        {m.awayTeam.name}
                      </button>
                    </div>
                  </div>
                ))}
                {errorSiguiente && <div className="bg-red-900/20 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm">{errorSiguiente}</div>}
                <button onClick={confirmarEmpates}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2.5 rounded-xl transition text-sm">
                  Continuar
                </button>
              </div>
            )}

            {pasoSiguiente === "pares" && (
              <div className="space-y-4">
                <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Nombre de la fase</label>
                <input type="text" value={siguienteLabel} onChange={(e) => setSiguienteLabel(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500" />

                <p className="text-gray-400 text-sm">Define fecha, hora y cancha de cada cruce:</p>
                {siguientePares.map((p, i) => (
                  <div key={i} className="bg-gray-800/50 border border-gray-800 rounded-xl p-4 space-y-3">
                    <p className="text-white font-semibold text-sm text-center">
                      {p.homeTeamName} <span className="text-gray-500">vs</span> {p.awayTeamName}
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <input type="date" value={p.fecha}
                        onChange={(e) => actualizarParSiguiente(i, "fecha", e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500" />
                      <input type="time" value={p.hora}
                        onChange={(e) => actualizarParSiguiente(i, "hora", e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500" />
                      <select value={p.cancha}
                        onChange={(e) => actualizarParSiguiente(i, "cancha", Number(e.target.value) as 1 | 2 | 3)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500">
                        <option value={1}>Cancha 1</option>
                        <option value={2}>Cancha 2</option>
                        <option value={3}>Cancha 3</option>
                      </select>
                    </div>
                  </div>
                ))}

                {errorSiguiente && <div className="bg-red-900/20 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm">{errorSiguiente}</div>}

                <button onClick={crearSiguienteRonda} disabled={generandoSiguiente}
                  className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition">
                  {generandoSiguiente ? "Generando..." : "Generar cruces"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}