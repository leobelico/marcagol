// Piezas HTML que comparten las tres direcciones.
import { EQUIPOS, LIGA } from "./datos.mjs";

export const ICONO = {
  palomita: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5"/></svg>`,
  reloj: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><path d="M8 4.6V8l2.3 1.6"/></svg>`,
  prohibido: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><path d="M3.8 12.2l8.4-8.4"/></svg>`,
  flecha: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>`,
  silbato: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="6" cy="9.5" r="3.6"/><path d="M8.8 7.2L14 5.4V8l-4 1"/></svg>`,
  pin: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M8 14.5s4.5-4.2 4.5-7.6a4.5 4.5 0 10-9 0C3.5 10.3 8 14.5 8 14.5z"/><circle cx="8" cy="6.9" r="1.6"/></svg>`,
  insta: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="3.5"/><circle cx="8" cy="8" r="2.8"/><circle cx="11.6" cy="4.4" r=".6" fill="currentColor"/></svg>`,
  compartir: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2v8M4.5 5.5L8 2l3.5 3.5M3 9.5V13h10V9.5"/></svg>`,
  menu: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"/></svg>`,
};

export function chip(p) {
  if (p.estado === "vivo") return `<span class="chip chip--vivo"><span class="chip__punto" aria-hidden="true"></span>En vivo · ${p.minuto}</span>`;
  if (p.estado === "final") return `<span class="chip chip--final">${ICONO.palomita}Final</span>`;
  if (p.estado === "programado") return `<span class="chip chip--prog">${ICONO.reloj}Por jugar</span>`;
  return `<span class="chip chip--cancel">${ICONO.prohibido}Cancelado</span>`;
}

export function escudo(id, grande = false) {
  const e = EQUIPOS[id];
  return `<span class="escudo${grande ? " escudo--g" : ""}" style="background:${e.color}" aria-hidden="true">${id}</span>`;
}

export function forma(arr) {
  const nombre = { G: "ganado", E: "empatado", P: "perdido" };
  return `<span class="forma" role="img" aria-label="Últimos 5: ${arr.map((x) => nombre[x]).join(", ")}">${arr
    .map((x) => `<span class="${x}">${x}</span>`)
    .join("")}</span>`;
}

export const nombre = (id) => EQUIPOS[id].nombre;

export function marcador(p) {
  if (p.estado === "final" || p.estado === "vivo") return `${p.gl}<span aria-hidden="true">–</span><span class="sr"> a </span>${p.gv}`;
  return "";
}

// Escudo de la liga de ejemplo: inventado (escudo con chevrón de valle).
export function escudoLiga(alto = 40) {
  return `<svg viewBox="0 0 64 72" height="${alto}" width="${Math.round((alto * 64) / 72)}" role="img" aria-label="Escudo de ${LIGA.nombre}">
    <path d="M32 2L60 10V36C60 53 47.5 64.5 32 70C16.5 64.5 4 53 4 36V10Z" fill="${LIGA.color}" stroke="${LIGA.acento}" stroke-width="3"/>
    <path d="M14 24L32 44L50 24" fill="none" stroke="${LIGA.acento}" stroke-width="6" stroke-linejoin="round"/>
    <text x="32" y="60" text-anchor="middle" font-family="Manrope, sans-serif" font-weight="800" font-size="11" fill="#fff" letter-spacing="1">${LIGA.siglas}</text>
  </svg>`;
}

export function documento({ titulo, descripcion, fuentes, css, cuerpo, claseBody = "" }) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo}</title>
<meta name="description" content="${descripcion}">
<link rel="icon" href="icono.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fuentes}&family=JetBrains+Mono:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="../compartido/familia.css">
<link rel="stylesheet" href="${css}">
</head>
<body class="${claseBody}">
${cuerpo}
</body>
</html>
`;
}
