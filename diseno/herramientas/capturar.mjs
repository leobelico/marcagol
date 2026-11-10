// Toma capturas PNG (deviceScaleFactor 2) de cada pantalla en diseno/capturas.
// Uso: PW_DIR=<carpeta con node_modules/playwright> node diseno/herramientas/capturar.mjs [a|b|c|index]
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const req = createRequire(process.env.PW_DIR ? join(process.env.PW_DIR, "x.js") : import.meta.url);
const { chromium } = req("playwright");

const CARPETAS = { a: "a-tlachco", b: "b-talud", c: "c-rebote", b1: "b1-rotulado", b2: "b2-llano", b3: "b3-reflector" };
const TOMAS = [
  ["landing", 1280, "light"], ["landing", 390, "light"],
  ["tabla-jornada", 1280, "light"], ["tabla-jornada", 390, "light"],
  ["liga-movil", 390, "light"], ["liga-movil", 390, "dark"],
];
const filtro = process.argv[2];
const salida = join(raiz, "capturas");
mkdirSync(salida, { recursive: true });

const navegador = await chromium.launch();
async function tomar(archivo, ancho, esquema, destino) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: 900 }, deviceScaleFactor: 2, colorScheme: esquema, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(archivo).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: destino, fullPage: true });
  await ctx.close();
  console.log("✓", destino.split(/[\/]/).pop());
}
for (const [letra, carpeta] of Object.entries(CARPETAS)) {
  if (filtro && filtro !== letra) continue;
  for (const [pantalla, ancho, esquema] of TOMAS) {
    const nombre = `${letra}-${pantalla}-${ancho}${esquema === "dark" ? "-oscuro" : ""}.png`;
    await tomar(join(raiz, carpeta, `${pantalla}.html`), ancho, esquema, join(salida, nombre));
  }
}
if (!filtro || filtro === "index") {
  await tomar(join(raiz, "talud-colores.html"), 1280, "light", join(salida, "talud-colores-1280.png"));
  await tomar(join(raiz, "index.html"), 1280, "light", join(salida, "index-1280.png"));
}
await navegador.close();
