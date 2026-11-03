// src/lib/armadoRol.ts
//
// Motor del armado de rol semanal (sin dependencias de servidor: el
// admin lo usa también en el navegador para re-evaluar la vista previa
// cuando se mueve un partido).
//
// 1. Cruces: por liga, empareja a los equipos evitando rivales repetidos
//    y juntando equipos con horarios compatibles.
// 2. Horario: reparte los partidos en día/hora. Primero los que compraron
//    horario (prioridad 1, 2, …), luego los más restringidos. Cada partido
//    toma la casilla que mejor sirve a los dos equipos.
// 3. Cancha: dentro de cada horario, la rosa (cancha 3) va primero a
//    femenil, luego mixta, luego varonil. Es preferencia, no regla: si la
//    rosa ya está ocupada el partido va a una verde.

import { CANCHA_ROSA, NUM_CANCHAS, claveCasilla, type Casilla, type Opcion } from "./rol";

export type Categoria = "FEMENIL" | "MIXTA" | "VARONIL" | null;

export type EquipoArmado = {
  id: string;
  name: string;
  diaComprado: string | null;
  horaComprada: string | null;
  prioridadCompra: number | null;
  opciones: Opcion[];
  bloqueos: Casilla[];
  envioPreferencias: boolean;
};

export type LigaArmado = {
  id: string;
  name: string;
  categoria: Categoria;
  dias: string[];
  horas: string[];
  equipos: EquipoArmado[];
  // Partidos ya jugados/programados entre equipos (para no repetir)
  historial: { homeId: string; awayId: string }[];
  // Jornadas ya creadas (para contar descansos)
  jornadas: number;
};

export type PartidoArmado = {
  key: string;
  ligaId: string;
  homeId: string;
  awayId: string;
  dia: string | null;
  hora: string | null;
  cancha: number | null;
};

export type Propuesta = {
  partidos: PartidoArmado[];
  descansan: { ligaId: string; teamId: string }[];
};

// "dia|hora|cancha" ocupados por partidos que ya existen esa semana
export type Ocupados = string[];

const RANGO_CATEGORIA: Record<string, number> = { FEMENIL: 0, MIXTA: 1, VARONIL: 2 };
const BONO_ROSA: Record<string, number> = { FEMENIL: 8, MIXTA: 4, VARONIL: 0 };

export function rangoCategoria(c: Categoria) {
  return c ? RANGO_CATEGORIA[c] : 3;
}

// ------------------------------------------------------------
// PUNTAJE DE UNA CASILLA PARA UN EQUIPO
// ------------------------------------------------------------

export type Motivo =
  | { tipo: "compra"; completa: boolean }
  | { tipo: "opcion"; prioridad: number }
  | { tipo: "bloqueado" }
  | { tipo: "sinPreferencia" }
  | { tipo: "fueraDeOpciones" };

export function evaluarEquipo(eq: EquipoArmado, dia: string, hora: string): { puntos: number; motivo: Motivo } {
  const compraDia = !!eq.diaComprado;
  const compraHora = !!eq.horaComprada;
  if (compraDia || compraHora) {
    const okDia = !compraDia || eq.diaComprado === dia;
    const okHora = !compraHora || eq.horaComprada === hora;
    if (okDia && okHora) return { puntos: 400, motivo: { tipo: "compra", completa: true } };
  }

  if (eq.bloqueos.some((b) => b.dia === dia && b.hora === hora)) {
    return { puntos: -300, motivo: { tipo: "bloqueado" } };
  }

  const op = eq.opciones.find((o) => o.dia === dia && o.hora === hora);
  let puntos = 0;
  let motivo: Motivo = eq.envioPreferencias ? { tipo: "fueraDeOpciones" } : { tipo: "sinPreferencia" };
  if (op) {
    puntos = (11 - op.prioridad) * 10;
    motivo = { tipo: "opcion", prioridad: op.prioridad };
  }

  // Compró solo el día o solo la hora y cumple esa parte
  if ((compraDia && eq.diaComprado === dia) || (compraHora && eq.horaComprada === hora)) {
    puntos += 150;
    motivo = { tipo: "compra", completa: false };
  }

  return { puntos, motivo };
}

function puntosPartido(a: EquipoArmado, b: EquipoArmado, dia: string, hora: string) {
  return evaluarEquipo(a, dia, hora).puntos + evaluarEquipo(b, dia, hora).puntos;
}

function prioridadCompra(eq: EquipoArmado) {
  return eq.diaComprado || eq.horaComprada ? eq.prioridadCompra ?? 999 : Infinity;
}

// ------------------------------------------------------------
// 1. CRUCES
// ------------------------------------------------------------

function clavePar(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function armarCruces(liga: LigaArmado): { pares: [string, string][]; descansa: string | null } {
  const equipos = liga.equipos;
  const porId = new Map(equipos.map((e) => [e.id, e]));
  const casillas = liga.dias.flatMap((d) => liga.horas.map((h) => ({ d, h })));

  const veces = new Map<string, number>();
  const jugados = new Map<string, number>();
  const locales = new Map<string, number>();
  for (const m of liga.historial) {
    const k = clavePar(m.homeId, m.awayId);
    veces.set(k, (veces.get(k) ?? 0) + 1);
    jugados.set(m.homeId, (jugados.get(m.homeId) ?? 0) + 1);
    jugados.set(m.awayId, (jugados.get(m.awayId) ?? 0) + 1);
    locales.set(m.homeId, (locales.get(m.homeId) ?? 0) + 1);
  }

  const BYE = "__bye__";
  const ids = equipos.map((e) => e.id);
  if (ids.length % 2 === 1) ids.push(BYE);

  const peso = (a: string, b: string): number => {
    if (a === BYE || b === BYE) {
      // Descansa quien menos ha descansado (jornadas − partidos jugados)
      const t = a === BYE ? b : a;
      const descansos = Math.max(0, liga.jornadas - (jugados.get(t) ?? 0));
      return -200 * descansos;
    }
    const repetido = veces.get(clavePar(a, b)) ?? 0;
    const ea = porId.get(a)!;
    const eb = porId.get(b)!;
    let compat = 0;
    for (const { d, h } of casillas) compat = Math.max(compat, puntosPartido(ea, eb, d, h));
    // Dos equipos que compraron exactamente el mismo horario no se estorban
    return -1000 * repetido + compat;
  };

  // Greedy por peso
  const todos: { a: string; b: string; w: number }[] = [];
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++) todos.push({ a: ids[i], b: ids[j], w: peso(ids[i], ids[j]) });
  todos.sort((x, y) => y.w - x.w);

  const usado = new Set<string>();
  const pares: [string, string][] = [];
  for (const p of todos) {
    if (usado.has(p.a) || usado.has(p.b)) continue;
    usado.add(p.a);
    usado.add(p.b);
    pares.push([p.a, p.b]);
  }

  // Mejora local: intercambiar rivales entre dos parejas si conviene
  for (let vuelta = 0; vuelta < 30; vuelta++) {
    let mejoro = false;
    for (let i = 0; i < pares.length; i++) {
      for (let j = i + 1; j < pares.length; j++) {
        const [a, b] = pares[i];
        const [c, d] = pares[j];
        const actual = peso(a, b) + peso(c, d);
        const op1 = peso(a, c) + peso(b, d);
        const op2 = peso(a, d) + peso(b, c);
        if (op1 > actual && op1 >= op2) {
          pares[i] = [a, c];
          pares[j] = [b, d];
          mejoro = true;
        } else if (op2 > actual) {
          pares[i] = [a, d];
          pares[j] = [b, c];
          mejoro = true;
        }
      }
    }
    if (!mejoro) break;
  }

  let descansa: string | null = null;
  const reales: [string, string][] = [];
  for (const [a, b] of pares) {
    if (a === BYE) descansa = b;
    else if (b === BYE) descansa = a;
    else {
      // Local: el que menos veces ha sido local
      reales.push((locales.get(a) ?? 0) <= (locales.get(b) ?? 0) ? [a, b] : [b, a]);
    }
  }
  return { pares: reales, descansa };
}

// ------------------------------------------------------------
// 2 y 3. HORARIO + CANCHA
// ------------------------------------------------------------

export function generarPropuesta(ligas: LigaArmado[], ocupados: Ocupados): Propuesta {
  const ocupado = new Set(ocupados);
  const ligaPorId = new Map(ligas.map((l) => [l.id, l]));
  const equipoPorId = new Map(ligas.flatMap((l) => l.equipos.map((e) => [e.id, e] as const)));

  const partidos: PartidoArmado[] = [];
  const descansan: Propuesta["descansan"] = [];

  for (const liga of ligas) {
    if (liga.equipos.length < 2) continue;
    const { pares, descansa } = armarCruces(liga);
    if (descansa) descansan.push({ ligaId: liga.id, teamId: descansa });
    pares.forEach(([homeId, awayId], i) =>
      partidos.push({ key: `${liga.id}-${i}`, ligaId: liga.id, homeId, awayId, dia: null, hora: null, cancha: null })
    );
  }

  // Lugares libres por casilla (día|hora) y partidos asignados en ella
  const libres = new Map<string, number>();
  const enCasilla = new Map<string, PartidoArmado[]>();
  const libresDe = (dia: string, hora: string) => {
    const k = claveCasilla(dia, hora);
    if (!libres.has(k)) {
      let n = 0;
      for (let c = 1; c <= NUM_CANCHAS; c++) if (!ocupado.has(`${k}|${c}`)) n++;
      libres.set(k, n);
    }
    return libres.get(k)!;
  };
  const rosaDisponible = (dia: string, hora: string, cat: Categoria) => {
    const k = claveCasilla(dia, hora);
    if (ocupado.has(`${k}|${CANCHA_ROSA}`)) return false;
    return !(enCasilla.get(k) ?? []).some(
      (p) => rangoCategoria(ligaPorId.get(p.ligaId)!.categoria) <= rangoCategoria(cat)
    );
  };

  const opcionesUtiles = (p: PartidoArmado) => {
    const liga = ligaPorId.get(p.ligaId)!;
    const a = equipoPorId.get(p.homeId)!;
    const b = equipoPorId.get(p.awayId)!;
    let n = 0;
    for (const d of liga.dias) for (const h of liga.horas) if (puntosPartido(a, b, d, h) > 0) n++;
    return n;
  };

  const orden = [...partidos].sort((x, y) => {
    const px = Math.min(prioridadCompra(equipoPorId.get(x.homeId)!), prioridadCompra(equipoPorId.get(x.awayId)!));
    const py = Math.min(prioridadCompra(equipoPorId.get(y.homeId)!), prioridadCompra(equipoPorId.get(y.awayId)!));
    if (px !== py) return px - py;
    return opcionesUtiles(x) - opcionesUtiles(y);
  });

  for (const p of orden) {
    const liga = ligaPorId.get(p.ligaId)!;
    const a = equipoPorId.get(p.homeId)!;
    const b = equipoPorId.get(p.awayId)!;

    let mejor: { dia: string; hora: string; puntos: number } | null = null;
    for (const dia of liga.dias) {
      for (const hora of liga.horas) {
        const lib = libresDe(dia, hora);
        if (lib <= 0) continue;
        let puntos = puntosPartido(a, b, dia, hora);
        if (liga.categoria && rosaDisponible(dia, hora, liga.categoria)) puntos += BONO_ROSA[liga.categoria];
        // Desempate: casillas con más espacio, para no saturar
        puntos += lib * 0.01;
        if (!mejor || puntos > mejor.puntos) mejor = { dia, hora, puntos };
      }
    }
    if (!mejor) continue;

    const k = claveCasilla(mejor.dia, mejor.hora);
    p.dia = mejor.dia;
    p.hora = mejor.hora;
    libres.set(k, libresDe(mejor.dia, mejor.hora) - 1);
    enCasilla.set(k, [...(enCasilla.get(k) ?? []), p]);
  }

  // Canchas: dentro de cada casilla, la rosa primero a femenil > mixta > varonil
  for (const [k, lista] of enCasilla) {
    const canchas = [CANCHA_ROSA, ...Array.from({ length: NUM_CANCHAS }, (_, i) => i + 1).filter((c) => c !== CANCHA_ROSA)]
      .filter((c) => !ocupado.has(`${k}|${c}`));
    [...lista]
      .sort((x, y) => rangoCategoria(ligaPorId.get(x.ligaId)!.categoria) - rangoCategoria(ligaPorId.get(y.ligaId)!.categoria))
      .forEach((p, i) => (p.cancha = canchas[i] ?? null));
  }

  return { partidos, descansan };
}

// ------------------------------------------------------------
// REVISIÓN DE UNA PROPUESTA (también tras editarla a mano)
// ------------------------------------------------------------

export type Revision = {
  // Por partido: avisos para el admin
  avisos: Record<string, string[]>;
  // Por partido: cómo le fue a cada equipo
  motivos: Record<string, { home: Motivo | null; away: Motivo | null }>;
  errores: string[];
};

export function revisarPropuesta(ligas: LigaArmado[], partidos: PartidoArmado[], ocupados: Ocupados): Revision {
  const ligaPorId = new Map(ligas.map((l) => [l.id, l]));
  const equipoPorId = new Map(ligas.flatMap((l) => l.equipos.map((e) => [e.id, e] as const)));
  const ocupado = new Set(ocupados);
  const avisos: Revision["avisos"] = {};
  const motivos: Revision["motivos"] = {};
  const errores: string[] = [];

  const porCancha = new Map<string, string[]>();
  const porEquipo = new Map<string, number>();

  for (const p of partidos) {
    const lista: string[] = [];
    const liga = ligaPorId.get(p.ligaId);
    const home = equipoPorId.get(p.homeId);
    const away = equipoPorId.get(p.awayId);
    porEquipo.set(p.homeId, (porEquipo.get(p.homeId) ?? 0) + 1);
    porEquipo.set(p.awayId, (porEquipo.get(p.awayId) ?? 0) + 1);

    if (p.homeId === p.awayId) lista.push("Un equipo no puede jugar contra sí mismo.");

    if (!p.dia || !p.hora || !p.cancha) {
      lista.push("Sin horario: asígnalo a mano.");
      motivos[p.key] = { home: null, away: null };
    } else {
      const k = `${claveCasilla(p.dia, p.hora)}|${p.cancha}`;
      if (ocupado.has(k)) lista.push("Esa cancha ya tiene un partido publicado a esa hora.");
      porCancha.set(k, [...(porCancha.get(k) ?? []), p.key]);
      if (liga && (!liga.dias.includes(p.dia) || !liga.horas.includes(p.hora))) {
        lista.push("Fuera de los días/horarios de la liga.");
      }
      const mh = home ? evaluarEquipo(home, p.dia, p.hora).motivo : null;
      const ma = away ? evaluarEquipo(away, p.dia, p.hora).motivo : null;
      motivos[p.key] = { home: mh, away: ma };
      if (mh?.tipo === "bloqueado") lista.push(`${home!.name} bloqueó este horario.`);
      if (ma?.tipo === "bloqueado") lista.push(`${away!.name} bloqueó este horario.`);
      for (const eq of [home, away]) {
        if (eq && (eq.diaComprado || eq.horaComprada)) {
          const okDia = !eq.diaComprado || eq.diaComprado === p.dia;
          const okHora = !eq.horaComprada || eq.horaComprada === p.hora;
          if (!okDia || !okHora) lista.push(`${eq.name} compró ${[eq.diaComprado, eq.horaComprada].filter(Boolean).join(" ")} y no se respetó.`);
        }
      }
    }
    avisos[p.key] = lista;
  }

  for (const [k, keys] of porCancha) {
    if (keys.length > 1) {
      const [dia, hora, cancha] = k.split("|");
      keys.forEach((key) => avisos[key].push(`Choque: ${keys.length} partidos en cancha ${cancha} (${dia} ${hora}).`));
    }
  }
  for (const [id, n] of porEquipo) {
    if (n > 1) errores.push(`${equipoPorId.get(id)?.name ?? id} aparece en ${n} partidos.`);
  }

  return { avisos, motivos, errores };
}
