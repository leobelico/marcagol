// Logotipos de las tres direcciones. Las letras se construyen con trazos
// geométricos (no dependen de ninguna fuente instalada) y los símbolos
// abstraen la cancha del juego de pelota: su planta en forma de I, sus
// muros escalonados y el rebote de la pelota.

const r2 = (n) => Math.round(n * 100) / 100;

// ---------- Letras minúsculas de trazo (A y C) ----------
// Línea base y=100, altura x y=48, ascendentes y=16.
function minusculas(palabra, s, redondo) {
  const r = (52 - s) / 2;
  const cy = 74;
  const e = redondo ? s / 2 : 0;
  const top = 16, xh = 48, base = 100;
  const gap = s * 0.95;
  let x = 0, d = "";
  const puntos = [];
  for (const ch of palabra) {
    let w = 0;
    if (ch === "t") {
      const tc = s / 2 + 9;
      d += `M${r2(x + tc)} ${r2(26 + e)}V${r2(base - e)}M${r2(x + e)} ${r2(xh + s / 2)}H${r2(x + 2 * tc - e)}`;
      w = 2 * tc;
    } else if (ch === "l") {
      d += `M${r2(x + s / 2)} ${r2(top + e)}V${r2(base - e)}`;
      w = s;
    } else if (ch === "a") {
      const cx = x + s / 2 + r;
      d += `M${r2(cx + r)} ${cy}A${r2(r)} ${r2(r)} 0 1 0 ${r2(cx - r)} ${cy}A${r2(r)} ${r2(r)} 0 1 0 ${r2(cx + r)} ${cy}M${r2(cx + r)} ${r2(xh + e)}V${r2(base - e)}`;
      w = 2 * r + s;
    } else if (ch === "c") {
      const cx = x + s / 2 + r;
      const a = (48 * Math.PI) / 180;
      const px = cx + r * Math.cos(a);
      d += `M${r2(px)} ${r2(cy - r * Math.sin(a))}A${r2(r)} ${r2(r)} 0 1 0 ${r2(px)} ${r2(cy + r * Math.sin(a))}`;
      w = s / 2 + r + r * Math.cos(a) + s / 2;
    } else if (ch === "h") {
      d += `M${r2(x + s / 2)} ${r2(top + e)}V${r2(base - e)}M${r2(x + s / 2)} ${cy}A${r2(r)} ${r2(r)} 0 0 1 ${r2(x + s / 2 + 2 * r)} ${cy}V${r2(base - e)}`;
      w = 2 * r + s;
    } else if (ch === "i") {
      d += `M${r2(x + s / 2)} ${r2(xh + e)}V${r2(base - e)}`;
      puntos.push({ cx: r2(x + s / 2), cy: r2(xh - s * 1.25), r: r2(s * 0.62) });
      w = s;
    }
    x += w + gap;
  }
  return { d, puntos, ancho: r2(x - gap), alto: [top - (redondo ? 0 : 0), base] };
}

// ---------- Letras mayúsculas de bloque (B) ----------
// Cada letra lleva un escalón en la esquina superior izquierda, como un muro de la cancha.
function mayusculas(palabra) {
  const n = 9, s = 22;
  const formas = {
    T: { w: 60, p: [[[0, n], [n, n], [n, 0], [60, 0], [60, s], [41, s], [41, 100], [19, 100], [19, s], [0, s]]] },
    L: { w: 46, p: [[[0, n], [n, n], [n, 0], [s, 0], [s, 78], [46, 78], [46, 100], [0, 100]]] },
    A: { w: 60, p: [[[0, n], [n, n], [n, 0], [60, 0], [60, 100], [38, 100], [38, 62], [s, 62], [s, 100], [0, 100]], [[s, s], [38, s], [38, 42], [s, 42]]] },
    C: { w: 54, p: [[[0, n], [n, n], [n, 0], [54, 0], [54, s], [s, s], [s, 78], [54, 78], [54, 100], [0, 100]]] },
    H: { w: 60, p: [[[0, n], [n, n], [n, 0], [s, 0], [s, 39], [38, 39], [38, 0], [60, 0], [60, 100], [38, 100], [38, 61], [s, 61], [s, 100], [0, 100]]] },
    I: { w: 22, p: [[[0, n], [n, n], [n, 0], [s, 0], [s, 100], [0, 100]]] },
  };
  const gap = 10;
  let x = 0, d = "";
  for (const ch of palabra) {
    const f = formas[ch];
    for (const poly of f.p) d += "M" + poly.map(([px, py]) => `${px + x} ${py}`).join("L") + "Z";
    x += f.w + gap;
  }
  return { d, ancho: x - gap };
}

// ---------- Símbolos (en un lienzo de 512) ----------
const SIMBOLO = {
  A: {
    caja: [122, 94, 268, 324],
    dibujo: (c) => `
      <path d="M136 108H376V180H316V332H376V404H136V332H196V180H136Z" fill="none" stroke="${c.trazo}" stroke-width="28" stroke-linejoin="miter"/>
      <path d="M196 256H316" stroke="${c.trazo}" stroke-width="10"/>
      <circle cx="256" cy="256" r="36" fill="${c.pelota}"/>`,
  },
  B: {
    caja: [104, 150, 304, 244],
    dibujo: (c) => `
      <path d="M104 392V152H156V236H208V392Z" fill="${c.trazo}"/>
      <path d="M408 392V152H356V236H304V392Z" fill="${c.trazo}"/>
      <circle cx="256" cy="200" r="38" fill="${c.pelota}"/>`,
  },
  C: {
    caja: [130, 114, 252, 284],
    dibujo: (c) => `
      <path d="M160 144V368M352 144V368" stroke="${c.trazo}" stroke-width="44" stroke-linecap="round"/>
      <circle cx="256" cy="196" r="44" fill="${c.pelota}"/>
      <circle cx="232" cy="290" r="15" fill="${c.pelota}"/>
      <circle cx="216" cy="346" r="9" fill="${c.pelota}"/>`,
  },
};

const DIRECCION = {
  A: { palabra: () => minusculas("tlachtli", 12, false), estilo: "butt" },
  B: { palabra: () => mayusculas("TLACHTLI"), estilo: "bloque" },
  C: { palabra: () => minusculas("tlachtli", 14, true), estilo: "round" },
};

function dibujarPalabra(dir, color, colorPunto) {
  const w = DIRECCION[dir].palabra();
  if (DIRECCION[dir].estilo === "bloque") {
    return { svg: `<path d="${w.d}" fill="${color}"/>`, ancho: w.ancho, y0: 0, alto: 100 };
  }
  const s = dir === "A" ? 12 : 14;
  const cap = DIRECCION[dir].estilo === "round" ? "round" : "butt";
  const puntos = w.puntos.map((p) => `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="${colorPunto}"/>`).join("");
  return {
    svg: `<path d="${w.d}" fill="none" stroke="${color}" stroke-width="${s}" stroke-linecap="${cap}" stroke-linejoin="round"/>${puntos}`,
    ancho: w.ancho,
    y0: 16,
    alto: 84,
  };
}

// Logotipo horizontal: símbolo + palabra.
export function logotipo(dir, c, { fondo = null, titulo = "Tlachtli" } = {}) {
  const sim = SIMBOLO[dir];
  const [bx, by, bw, bh] = sim.caja;
  const H = 100; // alto del símbolo
  const k = H / bh;
  const simAncho = bw * k;
  const pal = dibujarPalabra(dir, c.texto, c.punto ?? c.texto);
  // la palabra mide 64 de alto
  const kp = (dir === "B" ? 56 : 64) / pal.alto;
  const sep = 26;
  const pad = fondo ? 36 : 4;
  const ancho = pad * 2 + simAncho + sep + pal.ancho * kp;
  const alto = pad * 2 + H;
  const py = pad + (H - pal.alto * kp) / 2 - pal.y0 * kp + (dir === "B" ? 0 : 4);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r2(ancho)} ${alto}" role="img" aria-label="${titulo}">
  <title>${titulo}</title>${fondo ? `\n  <rect width="100%" height="100%" rx="24" fill="${fondo}"/>` : ""}
  <g transform="translate(${pad} ${pad}) scale(${r2(k)}) translate(${-bx} ${-by})">${sim.dibujo(c)}
  </g>
  <g transform="translate(${r2(pad + simAncho + sep)} ${r2(py)}) scale(${r2(kp)})">${pal.svg}</g>
</svg>
`;
}

// Ícono cuadrado (favicon / ícono de app).
export function icono(dir, c, titulo = "Tlachtli") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="${titulo}">
  <title>${titulo}</title>
  <rect width="512" height="512" rx="112" fill="${c.fondo}"/>${SIMBOLO[dir].dibujo(c)}
</svg>
`;
}

// Solo el símbolo, sin fondo (para usar dentro de las pantallas).
export function simbolo(dir, c, alto = 24) {
  const [bx, by, bw, bh] = SIMBOLO[dir].caja;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bx} ${by} ${bw} ${bh}" height="${alto}" width="${r2((alto * bw) / bh)}" aria-hidden="true" focusable="false">${SIMBOLO[dir].dibujo(c)}</svg>`;
}
