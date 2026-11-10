// Tres variantes de color de la dirección B (Talud). Misma tipografía, rejilla,
// escalones y componentes; solo cambian los colores.
// Uso: node diseno/herramientas/talud-colores.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { logotipo, icono, simbolo } from "./logos.mjs";
import { LIGA } from "./datos.mjs";
import * as B from "./dir-b.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const { LIGA_COLORES, PARES } = new Function("module", readFileSync(join(raiz, "paletas.js"), "utf8") + "\nreturn module.exports;")({});

// escalon y sombra son decorativos (no llevan texto): por eso pueden ir en realce.
export const VARIANTES = [
  {
    id: "b1", carpeta: "b1-rotulado", nombre: "Rotulado", lema: "Rosa mexicano, añil y canario",
    historia: "Los letreros pintados a mano de la tienda de la esquina y las mantas del torneo: color franco y alegre sobre papel blanco.",
    si: "La más alegre y la que más se reconoce de lejos; el rosa no lo usa ninguna app deportiva.",
    no: "Con ligas de color vino o rosa el acento compite con la liga; ahí conviene bajarlo a añil.",
    claro: {
      fondo: "#F5F4F8", superficie: "#FFFFFF", texto: "#1A1B44", suave: "#4F5075", borde: "#DCDBE6",
      acento: "#C0165E", sobreAcento: "#FFFFFF", realce: "#FFD23F", sobreRealce: "#1A1B44",
      vivo: "#1A1B44", sobreVivo: "#FFFFFF", cancelado: "#7A5A00", pierde: "#B3261E",
      escalon: "#C0165E", sombra: "#FFD23F",
    },
    oscuro: {
      fondo: "#111233", superficie: "#1A1C45", texto: "#F4F3FB", suave: "#ACABCB", borde: "#2E3060",
      acento: "#FF7AAE", sobreAcento: "#111233", realce: "#FFD23F", sobreRealce: "#1A1B44",
      vivo: "#F4F3FB", sobreVivo: "#111233", cancelado: "#E8C25A", pierde: "#FF8F86",
      escalon: "#FF7AAE", sombra: "#FFD23F",
    },
  },
  {
    id: "b2", carpeta: "b2-llano", nombre: "Llano", lema: "Pasto, cal y tarjeta amarilla",
    historia: "El campo del domingo: pasto recién regado, las líneas de cal y la tarjeta amarilla del árbitro.",
    si: "Se lee como fútbol al instante y es la más tranquila para pantallas con mucha tabla.",
    no: "Verde con amarillo es lo esperado en deporte; se distingue menos de otras apps.",
    claro: {
      fondo: "#EEF1EA", superficie: "#FFFFFF", texto: "#12261A", suave: "#4B5A50", borde: "#D3DACD",
      acento: "#1C6B37", sobreAcento: "#FFFFFF", realce: "#FFD400", sobreRealce: "#12261A",
      vivo: "#12261A", sobreVivo: "#FFFFFF", cancelado: "#7A5A00", pierde: "#B3261E",
      escalon: "#1C6B37", sombra: "#FFD400",
    },
    oscuro: {
      fondo: "#0C1A11", superficie: "#13251A", texto: "#EDF3EC", suave: "#A3B4A8", borde: "#26392C",
      acento: "#62D68D", sobreAcento: "#0C1A11", realce: "#FFD400", sobreRealce: "#12261A",
      vivo: "#EDF3EC", sobreVivo: "#0C1A11", cancelado: "#E8C25A", pierde: "#FF8F86",
      escalon: "#62D68D", sombra: "#FFD400",
    },
  },
  {
    id: "b3", carpeta: "b3-reflector", nombre: "Reflector", lema: "Asfalto, concreto y luz de sodio",
    historia: "La cancha de fútbol rápido entre semana: concreto gris, malla, y el ámbar de las lámparas a las nueve de la noche.",
    si: "La más sobria y urbana; el ámbar deja al color de la liga como lo más vivo de la pantalla.",
    no: "En modo claro el acento azul pizarra es serio; pierde parte de la energía de fin de semana.",
    claro: {
      fondo: "#E9EBEE", superficie: "#F8F9FA", texto: "#161C26", suave: "#4C5563", borde: "#CBD0D7",
      acento: "#24466F", sobreAcento: "#FFFFFF", realce: "#FFB21E", sobreRealce: "#161C26",
      vivo: "#161C26", sobreVivo: "#F8F9FA", cancelado: "#7A5300", pierde: "#B3261E",
      escalon: "#FFB21E", sombra: "#FFB21E",
    },
    oscuro: {
      fondo: "#0F141B", superficie: "#182029", texto: "#ECEFF3", suave: "#A3ADBA", borde: "#2A3441",
      acento: "#FFB21E", sobreAcento: "#161C26", realce: "#FFB21E", sobreRealce: "#161C26",
      vivo: "#ECEFF3", sobreVivo: "#0F141B", cancelado: "#E8C25A", pierde: "#FF8F86",
      escalon: "#FFB21E", sombra: "#FFB21E",
    },
  },
];

// ---------- contraste ----------
function lum(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const PARES_LIGA = [["ligaTinta", "fondo"], ["ligaTinta", "superficie"]];
const fallas = [];
for (const v of VARIANTES) {
  v.contrastes = [];
  for (const [t, f] of [...PARES, ...PARES_LIGA]) {
    const fila = [t, f];
    for (const modo of ["claro", "oscuro"]) {
      const p = { ...v[modo], ligaTinta: modo === "claro" ? LIGA_COLORES.color : LIGA_COLORES.tintaOscuro };
      const c = contraste(p[t], p[f]);
      if (c < 4.5) fallas.push(`${v.nombre} ${modo}: ${t} ${p[t]} / ${f} ${p[f]} = ${c.toFixed(2)}`);
      fila.push(c);
    }
    v.contrastes.push(fila);
  }
}
if (fallas.length) { console.error("No pasan AA:\n" + fallas.join("\n")); process.exit(1); }

// ---------- tokens ----------
const kebab = (k) => k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
const vars = (pal, ind = "  ") => Object.entries(pal).map(([k, x]) => `${ind}--${kebab(k)}: ${x};`).join("\n");
function tokens(v) {
  return `/* Generado por herramientas/talud-colores.mjs. No editar a mano. */
:root {
  color-scheme: light;
${vars(v.claro)}
  --liga: ${LIGA.color};
  --liga-texto: ${LIGA.colorTexto};
  --liga-acento: ${LIGA.acento};
  --liga-tinta: ${LIGA.color};
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
${vars(v.oscuro, "    ")}
    --liga-tinta: ${LIGA_COLORES.tintaOscuro};
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
${vars(v.oscuro)}
  --liga-tinta: ${LIGA_COLORES.tintaOscuro};
}
.modo-oscuro {
  color-scheme: dark;
${vars(v.oscuro)}
  --liga-tinta: ${LIGA_COLORES.tintaOscuro};
}
.modo-claro {
  color-scheme: light;
${vars(v.claro)}
  --liga-tinta: ${LIGA.color};
}
`;
}

// El tema de Talud, con escalones y sombras duras tomando su propio token.
const temaBase = readFileSync(join(raiz, "b-talud", "tema.css"), "utf8")
  .replace(/^\/\*.*?\*\//, "/* Dirección B · Talud, variante de color. Copiado de b-talud/tema.css por talud-colores.mjs: escalones y sombras duras usan --escalon y --sombra. */")
  .replace("height: 24px; background: var(--acento);", "height: 24px; background: var(--escalon);")
  .replace(/box-shadow: (\d+px \d+px 0) var\(--acento\)/g, "box-shadow: $1 var(--sombra)");

for (const v of VARIANTES) {
  const dir = join(raiz, v.carpeta);
  mkdirSync(dir, { recursive: true });
  const c = v.claro, o = v.oscuro;
  const L = {
    claro: { trazo: c.acento, pelota: c.texto, texto: c.texto },
    mono: { trazo: c.texto, pelota: c.texto, texto: c.texto },
    oscuro: { trazo: o.acento, pelota: o.texto, texto: o.texto, fondo: o.fondo },
    icono: v.id === "b3"
      ? { fondo: c.texto, trazo: c.superficie, pelota: c.realce }
      : { fondo: c.acento, trazo: c.superficie, pelota: c.realce },
    enLinea: { trazo: "var(--acento)", pelota: "var(--texto)" },
  };
  v.logos = L;
  writeFileSync(join(dir, "tokens.css"), tokens(v));
  writeFileSync(join(dir, "tema.css"), temaBase);
  writeFileSync(join(dir, "logo-principal.svg"), logotipo("B", L.claro));
  writeFileSync(join(dir, "logo-mono.svg"), logotipo("B", L.mono));
  writeFileSync(join(dir, "logo-oscuro.svg"), logotipo("B", L.oscuro, { fondo: o.fondo }));
  writeFileSync(join(dir, "icono.svg"), icono("B", L.icono));
  const ayuda = {
    logo: (modo) => logotipo("B", L[modo]),
    simb: (_m, alto = 20) => simbolo("B", L.enLinea, alto),
  };
  writeFileSync(join(dir, "landing.html"), B.landing(ayuda));
  writeFileSync(join(dir, "tabla-jornada.html"), B.tablaJornada(ayuda));
  writeFileSync(join(dir, "liga-movil.html"), B.ligaMovil(ayuda));
  console.log(`${v.nombre}: listo en ${v.carpeta}/`);
}

// ---------- página de comparación ----------
const USOS = { fondo: "Fondo", superficie: "Tarjetas y boletos", texto: "Texto y marcadores", suave: "Texto secundario", acento: "Botón, enlaces, números", realce: "Sombras, líder, pelota del ícono", vivo: "Chip «En vivo»", pierde: "Derrotas" };
const muestra = (pal) => Object.entries(USOS).map(([k, u]) => `
        <li><span class="sw" style="background:${pal[k]}"></span><span><b>${pal[k]}</b> ${u}</span></li>`).join("");
const fmt = (n) => `${n.toFixed(1)}`;
const tablaC = (v) => v.contrastes.map(([t, f, a, b]) => `<tr><td>${t} / ${f}</td><td>${fmt(a)}</td><td>${fmt(b)}</td></tr>`).join("");
const columna = (v) => `
  <article class="col" style="--a:${v.claro.acento}; --r:${v.claro.realce}; --t:${v.claro.texto}; --f:${v.claro.fondo}; --ao:${v.oscuro.acento}; --fo:${v.oscuro.fondo}">
    <div class="col__logo" style="background:${v.claro.fondo}">${logotipo("B", v.logos.claro)}</div>
    <div class="col__logo" style="background:${v.oscuro.fondo}">${logotipo("B", v.logos.oscuro)}</div>
    <div class="col__fila">
      <span class="ico">${icono("B", v.logos.icono)}</span>
      <div>
        <h2>${v.nombre}</h2>
        <p class="lema">${v.lema}</p>
      </div>
    </div>
    <p class="historia">${v.historia}</p>
    <div class="paletas">
      <div><h3>Claro</h3><ul>${muestra(v.claro)}</ul></div>
      <div><h3>Oscuro</h3><ul>${muestra(v.oscuro)}</ul></div>
    </div>
    <a class="captura" href="${v.carpeta}/landing.html"><img src="capturas/${v.id}-landing-1280.png" alt="Portada de la landing, variante ${v.nombre}" loading="lazy"></a>
    <div class="moviles">
      <a href="${v.carpeta}/liga-movil.html"><img src="capturas/${v.id}-liga-movil-390.png" alt="Página de la liga en celular, modo claro, ${v.nombre}" loading="lazy"></a>
      <a href="${v.carpeta}/liga-movil.html"><img src="capturas/${v.id}-liga-movil-390-oscuro.png" alt="Página de la liga en celular, modo oscuro, ${v.nombre}" loading="lazy"></a>
    </div>
    <ul class="enlaces">
      <li><a href="${v.carpeta}/landing.html">Landing</a></li>
      <li><a href="${v.carpeta}/tabla-jornada.html">Tabla y jornada</a></li>
      <li><a href="${v.carpeta}/liga-movil.html">Liga en celular</a></li>
    </ul>
    <p class="pq"><b>Por qué sí.</b> ${v.si}</p>
    <p class="pq"><b>Por qué no.</b> ${v.no}</p>
    <details><summary>Contraste verificado (AA, 4.5:1)</summary>
      <table><thead><tr><th>Par</th><th>Claro</th><th>Oscuro</th></tr></thead><tbody>${tablaC(v)}</tbody></table>
    </details>
  </article>`;

writeFileSync(join(raiz, "talud-colores.html"), `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Talud · Tres paletas</title>
<meta name="description" content="Tres paletas de color para la dirección Talud de Tlachtli.">
<link rel="icon" href="b1-rotulado/icono.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@800;900&family=Manrope:wght@400;600;800&display=swap">
<style>
:root { color-scheme: light; --fondo: #F3F3F1; --sup: #FFFFFF; --texto: #16181D; --suave: #555B66; --borde: #D6D8DC; }
@media (prefers-color-scheme: dark) { :root { color-scheme: dark; --fondo: #111317; --sup: #1A1D22; --texto: #EDEEF0; --suave: #A4AAB4; --borde: #2C3038; } }
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; background: var(--fondo); color: var(--texto); font-family: "Manrope", system-ui, sans-serif; line-height: 1.5; }
h1, h2, h3, p, ul { margin: 0; padding: 0; }
ul { list-style: none; }
a { color: inherit; }
img { display: block; width: 100%; height: auto; }
:focus-visible { outline: 3px solid currentColor; outline-offset: 3px; }
.env { max-width: 1440px; margin: 0 auto; padding: 0 24px 64px; }
header { padding: 44px 0 32px; max-width: 760px; }
h1 { font-family: "Big Shoulders Display", sans-serif; font-weight: 900; font-size: 56px; line-height: 0.95; text-transform: uppercase; }
header p { margin-top: 12px; color: var(--suave); }
header a { font-weight: 700; }
.cols { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; align-items: start; }
.col { background: var(--sup); border: 1px solid var(--borde); border-radius: 6px; padding: 20px; display: grid; gap: 16px; border-top: 8px solid var(--a); }
.col__logo { border-radius: 4px; padding: 22px 20px; }
.col__logo svg { height: 34px; width: auto; display: block; }
.col__fila { display: flex; gap: 14px; align-items: center; }
.ico svg { width: 56px; height: 56px; display: block; border-radius: 12px; }
h2 { font-family: "Big Shoulders Display", sans-serif; font-weight: 900; font-size: 40px; line-height: 0.9; text-transform: uppercase; }
.lema { color: var(--suave); font-weight: 600; }
.historia { font-size: 15px; }
.paletas { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
h3 { font-size: 13px; font-weight: 800; margin-bottom: 6px; }
.paletas li { display: flex; gap: 8px; align-items: center; font-size: 12px; line-height: 1.25; padding: 3px 0; color: var(--suave); }
.paletas b { color: var(--texto); font-variant-numeric: tabular-nums; margin-right: 2px; }
.sw { width: 22px; height: 22px; border-radius: 4px; flex: none; box-shadow: inset 0 0 0 1px rgb(127 127 127 / .35); }
.captura, .moviles a { border: 1px solid var(--borde); border-radius: 4px; overflow: hidden; display: block; max-height: 300px; }
.moviles { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.moviles a { max-height: 340px; }
.enlaces { display: flex; flex-wrap: wrap; gap: 8px; }
.enlaces a { display: inline-flex; align-items: center; min-height: 44px; padding: 0 14px; border-radius: 4px; background: var(--a); color: #fff; font-weight: 800; font-size: 14px; text-decoration: none; }
.col:nth-child(3) .enlaces a { background: var(--t); }
.pq { font-size: 14px; }
details { font-size: 13px; color: var(--suave); }
summary { cursor: pointer; font-weight: 700; min-height: 32px; }
table { width: 100%; border-collapse: collapse; margin-top: 8px; font-variant-numeric: tabular-nums; }
th, td { text-align: left; padding: 3px 4px; border-bottom: 1px solid var(--borde); }
@media (max-width: 1080px) { .cols { grid-template-columns: 1fr; max-width: 560px; } }
@media (max-width: 480px) { .env { padding: 0 16px 48px; } h1 { font-size: 40px; } .paletas { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="env">
  <header>
    <h1>Talud en tres paletas</h1>
    <p>Misma tipografía, mismos escalones, mismos boletos de partido. Solo cambia el color. Las tres pasan AA en claro y oscuro, y la liga de ejemplo sigue siendo vino y oro. La original, barro y tinta, sigue en <a href="index.html">el índice</a>.</p>
  </header>
  <div class="cols">${VARIANTES.map(columna).join("")}
  </div>
</div>
</body>
</html>
`);
console.log("talud-colores.html escrito. Contrastes AA: todos pasan.");
