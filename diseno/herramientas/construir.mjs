// Genera tokens.css, logotipos SVG y pantallas HTML de cada dirección.
// Uso: node diseno/herramientas/construir.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { logotipo, icono, simbolo } from "./logos.mjs";
import { LIGA } from "./datos.mjs";
import * as A from "./dir-a.mjs";
import * as B from "./dir-b.mjs";
import * as C from "./dir-c.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const { PALETAS, LIGA_COLORES } = new Function("module", readFileSync(join(raiz, "paletas.js"), "utf8") + "\nreturn module.exports;")({});

const DIRS = {
  A: {
    carpeta: "a-tlachco", mod: A,
    logos: {
      claro: { trazo: "#0A7350", pelota: "#E8B931", texto: "#10201A", punto: "#10201A" },
      mono: { trazo: "#10201A", pelota: "#10201A", texto: "#10201A", punto: "#10201A" },
      oscuro: { trazo: "#3CCB8F", pelota: "#F0C64A", texto: "#E9EEE9", punto: "#E9EEE9", fondo: "#0B1411" },
      icono: { fondo: "#10201A", trazo: "#F4F2EC", pelota: "#E8B931" },
      enLinea: { trazo: "var(--acento)", pelota: "var(--realce)" },
    },
  },
  B: {
    carpeta: "b-talud", mod: B,
    logos: {
      claro: { trazo: "#A93F17", pelota: "#1F1A17", texto: "#1F1A17" },
      mono: { trazo: "#1F1A17", pelota: "#1F1A17", texto: "#1F1A17" },
      oscuro: { trazo: "#F2885A", pelota: "#F6EEE4", texto: "#F6EEE4", fondo: "#17120F" },
      icono: { fondo: "#A93F17", trazo: "#F7F0E6", pelota: "#1F1A17" },
      enLinea: { trazo: "var(--acento)", pelota: "var(--texto)" },
    },
  },
  C: {
    carpeta: "c-rebote", mod: C,
    logos: {
      claro: { trazo: "#0B1233", pelota: "#2638C9", texto: "#0B1233", punto: "#2638C9" },
      mono: { trazo: "#0B1233", pelota: "#0B1233", texto: "#0B1233", punto: "#0B1233" },
      oscuro: { trazo: "#EEF1FF", pelota: "#D4F54A", texto: "#EEF1FF", punto: "#D4F54A", fondo: "#080C22" },
      icono: { fondo: "#2638C9", trazo: "#FFFFFF", pelota: "#C6EE3A" },
      enLinea: { trazo: "var(--texto)", pelota: "var(--acento)" },
    },
  },
};

const kebab = (k) => k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
const vars = (pal) => Object.entries(pal).map(([k, v]) => `  --${kebab(k)}: ${v};`).join("\n");

function tokens(p) {
  const liga = `  --liga: ${LIGA.color};\n  --liga-texto: ${LIGA.colorTexto};\n  --liga-acento: ${LIGA.acento};
  --liga-tinta: ${LIGA.color};`;
  const tintaO = `  --liga-tinta: ${LIGA_COLORES.tintaOscuro};`;
  return `/* Generado desde paletas.js por herramientas/construir.mjs. No editar a mano. */
:root {
  color-scheme: light;
${vars(p.claro)}
${liga}
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
${vars(p.oscuro).replace(/^/gm, "  ")}
  ${tintaO}
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
${vars(p.oscuro)}
${tintaO}
}
/* Para fijar un modo dentro de una sección */
.modo-oscuro {
  color-scheme: dark;
${vars(p.oscuro)}
${tintaO}
}
.modo-claro {
  color-scheme: light;
${vars(p.claro)}
  --liga-tinta: ${LIGA.color};
}
`;
}

for (const [id, d] of Object.entries(DIRS)) {
  const dir = join(raiz, d.carpeta);
  mkdirSync(dir, { recursive: true });
  const L = d.logos;
  writeFileSync(join(dir, "tokens.css"), tokens(PALETAS[id]));
  writeFileSync(join(dir, "logo-principal.svg"), logotipo(id, L.claro));
  writeFileSync(join(dir, "logo-mono.svg"), logotipo(id, L.mono));
  writeFileSync(join(dir, "logo-oscuro.svg"), logotipo(id, L.oscuro, { fondo: L.oscuro.fondo }));
  writeFileSync(join(dir, "icono.svg"), icono(id, L.icono));
  const ayuda = {
    logo: (modo) => logotipo(id, modo === "oscuro" ? { ...L.oscuro } : L[modo]),
    simb: (_modo, alto = 20) => simbolo(id, L.enLinea, alto),
  };
  writeFileSync(join(dir, "landing.html"), d.mod.landing(ayuda));
  writeFileSync(join(dir, "tabla-jornada.html"), d.mod.tablaJornada(ayuda));
  writeFileSync(join(dir, "liga-movil.html"), d.mod.ligaMovil(ayuda));
  console.log(`${id}: listo en ${d.carpeta}/`);
}
