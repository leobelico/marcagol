// Datos inventados que usan las tres direcciones, para compararlas con el mismo contenido.

export const LIGA = {
  nombre: "Liga Valle del Sol",
  siglas: "LVS",
  torneo: "Apertura 2026",
  categoria: "Fútbol 7 varonil",
  sede: "Unidad Deportiva Valle del Sol",
  organiza: "Rocío Mendoza",
  color: "#7C1D3A", // color propio de la liga (vino)
  colorTexto: "#FFFFFF",
  acento: "#F2B705", // segundo color de la liga (oro)
};

export const EQUIPOS = {
  HF: { nombre: "Halcones FC", color: "#1F3A8A" },
  RT: { nombre: "Real Tangamanga", color: "#0F766E" },
  DM: { nombre: "Deportivo Morelos", color: "#9F1239" },
  CT: { nombre: "Club Tequis", color: "#6D28D9" },
  AS: { nombre: "Atlético Saucito", color: "#9A4A07" },
  LC: { nombre: "Los Cuervos", color: "#111827" },
  JS: { nombre: "Juventud Soledad", color: "#166534" },
  RV: { nombre: "Rayos de Villa", color: "#854D0E" },
  UP: { nombre: "Unión Pozos", color: "#075985" },
  SL: { nombre: "Sporting Lomas", color: "#7C2D12" },
  PV: { nombre: "Pumitas del Valle", color: "#3F6212" },
  TP: { nombre: "Toros Pinos", color: "#BE123C" },
};

// [sigla, G, E, P, GF, GC, forma (últimos 5, el más reciente al final)]
const FILAS = [
  ["HF", 6, 1, 1, 22, 9, "GGEGP"],
  ["RT", 6, 0, 2, 19, 10, "GPGGG"],
  ["DM", 5, 2, 1, 17, 8, "EGGEG"],
  ["CT", 5, 1, 2, 15, 11, "GGPEG"],
  ["AS", 4, 2, 2, 14, 12, "PEGGE"],
  ["LC", 4, 1, 3, 16, 14, "GPPGG"],
  ["JS", 3, 2, 3, 12, 13, "EPGEP"],
  ["RV", 3, 1, 4, 11, 15, "PGPGP"],
  ["UP", 1, 3, 4, 10, 13, "EEPPE"],
  ["SL", 1, 2, 5, 8, 17, "PEPPG"],
  ["PV", 1, 1, 6, 9, 16, "PPGPP"],
  ["TP", 1, 0, 7, 6, 21, "PPPGP"],
];

export const TABLA = FILAS.map(([id, g, e, p, gf, gc, forma], i) => ({
  pos: i + 1,
  id,
  ...EQUIPOS[id],
  pj: g + e + p,
  g, e, p, gf, gc,
  dif: gf - gc,
  pts: g * 3 + e,
  forma: forma.split(""),
}));

export const CORTE_LIGUILLA = 8;

export const JORNADA = {
  numero: 9,
  fecha: "Domingo 15 de noviembre",
  fechaCorta: "Dom 15 nov",
  jornadas: [
    { n: 7, fecha: "1 nov" },
    { n: 8, fecha: "8 nov" },
    { n: 9, fecha: "15 nov", actual: true },
    { n: 10, fecha: "22 nov" },
    { n: 11, fecha: "29 nov" },
  ],
  horarios: ["09:00", "10:15", "11:30"],
  canchas: ["Cancha 1", "Cancha 2"],
  partidos: [
    { hora: "09:00", cancha: "Cancha 1", local: "HF", visita: "UP", gl: 2, gv: 1, estado: "final", arbitro: "Javier Olvera" },
    { hora: "09:00", cancha: "Cancha 2", local: "DM", visita: "SL", gl: 0, gv: 0, estado: "final", arbitro: "Sandra Ríos" },
    { hora: "10:15", cancha: "Cancha 1", local: "RT", visita: "CT", gl: 1, gv: 2, estado: "vivo", minuto: "63'", arbitro: "Javier Olvera" },
    { hora: "10:15", cancha: "Cancha 2", local: "AS", visita: "LC", estado: "programado", arbitro: "Sandra Ríos" },
    { hora: "11:30", cancha: "Cancha 1", local: "JS", visita: "RV", estado: "programado", arbitro: "Luis Castañeda" },
    { hora: "11:30", cancha: "Cancha 2", local: "PV", visita: "TP", estado: "cancelado", nota: "Cancha en mantenimiento · se reprograma" },
  ],
};

export const GOLEADORES = [
  { nombre: "Iván Treviño", equipo: "HF", goles: 11 },
  { nombre: "Marco Ledesma", equipo: "RT", goles: 9 },
  { nombre: "Rogelio Pardo", equipo: "DM", goles: 8 },
  { nombre: "Saúl Infante", equipo: "CT", goles: 7 },
  { nombre: "Kevin Almanza", equipo: "LC", goles: 7 },
];

export const ROLES = [
  { rol: "Organizadores", texto: "Arma el calendario, publica resultados y cierra la tabla sin hojas de cálculo." },
  { rol: "Árbitros", texto: "Captura goles y tarjetas desde la cancha, aunque la señal sea mala." },
  { rol: "Capitanes", texto: "Registra a tu plantel y revisa sanciones antes del partido." },
  { rol: "Afición", texto: "Sigue el marcador, la tabla y el goleo desde el celular." },
];
