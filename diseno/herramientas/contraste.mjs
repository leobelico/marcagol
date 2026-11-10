// Verifica los contrastes WCAG de las paletas y escribe diseno/CONTRASTE.md.
// Uso: node diseno/herramientas/contraste.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { EQUIPOS } from "./datos.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const fuente = readFileSync(join(raiz, "paletas.js"), "utf8");
const { PALETAS, PARES, LIGA_COLORES } = new Function("module", fuente + "\nreturn module.exports;")({});

function lum(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contraste(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const fallas = [];
let md = "# Contraste verificado (WCAG 2.1)\n\nGenerado por `herramientas/contraste.mjs`. AA para texto normal pide 4.5:1; todos los pares de texto se exigen a 4.5:1 aunque sean texto grande.\n";

for (const [id, p] of Object.entries(PALETAS)) {
  md += `\n## ${id} · ${p.nombre} (${p.lema})\n\n| Texto | Sobre | Claro | Oscuro |\n|---|---|---|---|\n`;
  for (const [t, f] of PARES) {
    const c = contraste(p.claro[t], p.claro[f]);
    const o = contraste(p.oscuro[t], p.oscuro[f]);
    for (const [modo, v, pal] of [["claro", c, p.claro], ["oscuro", o, p.oscuro]]) {
      if (v < 4.5) fallas.push(`${id} ${modo}: ${t} ${pal[t]} sobre ${f} ${pal[f]} = ${v.toFixed(2)}`);
    }
    const s = (v) => `${v.toFixed(2)}:1 ${v >= 7 ? "AAA" : v >= 4.5 ? "AA" : "✗"}`;
    md += `| ${t} | ${f} | ${s(c)} | ${s(o)} |\n`;
  }
}

md += "\n## Liga de ejemplo y escudos de equipos\n\nLos colores de la liga los pone cada cliente; la plataforma revisa que el texto sobre ellos pase AA y, si no, usa tinta oscura.\n\n| Texto | Sobre | Contraste |\n|---|---|---|\n";
const extra = [
  ["Blanco sobre color de liga", LIGA_COLORES.colorTexto, LIGA_COLORES.color],
  ["Oro de la liga sobre color de liga", LIGA_COLORES.acento, LIGA_COLORES.color],
  ...Object.entries(PALETAS).flatMap(([id, p]) => [
    [`${id} claro: color de liga como texto sobre fondo`, LIGA_COLORES.color, p.claro.fondo],
    [`${id} claro: color de liga como texto sobre superficie`, LIGA_COLORES.color, p.claro.superficie],
    [`${id} oscuro: tinta clara de liga sobre fondo`, LIGA_COLORES.tintaOscuro, p.oscuro.fondo],
    [`${id} oscuro: tinta clara de liga sobre superficie`, LIGA_COLORES.tintaOscuro, p.oscuro.superficie],
  ]),
  ...Object.values(EQUIPOS).map((e) => [`Iniciales sobre escudo ${e.nombre}`, "#FFFFFF", e.color]),
];
for (const [n, a, b] of extra) {
  const v = contraste(a, b);
  if (v < 4.5) fallas.push(`${n}: ${v.toFixed(2)}`);
  md += `| ${n} | ${b} | ${v.toFixed(2)}:1 ${v >= 7 ? "AAA" : v >= 4.5 ? "AA" : "✗"} |\n`;
}

md += "\n## Estados de partido sin depender del color\n\nCada estado tiene forma, ícono y texto propios, así se distinguen en escala de grises o con daltonismo:\n\n| Estado | Forma | Ícono | Texto |\n|---|---|---|---|\n| En vivo | Píldora rellena | Punto que late (sin animación si el sistema pide menos movimiento) | «En vivo · 63'» |\n| Final | Píldora con borde continuo | Palomita | «Final» |\n| Por jugar | Píldora con borde punteado | Reloj | «Por jugar» |\n| Cancelado | Sin borde, equipos tachados | Círculo con diagonal | «Cancelado» |\n\nLa forma reciente de cada equipo se escribe con letras (G, E, P) dentro de figuras distintas (cuadro relleno, cuadro con borde, círculo con borde), no solo con verde y rojo.\n";

writeFileSync(join(raiz, "CONTRASTE.md"), md);
if (fallas.length) {
  console.error("No pasan AA:\n" + fallas.join("\n"));
  process.exit(1);
}
console.log("Todos los pares pasan AA. CONTRASTE.md escrito.");
