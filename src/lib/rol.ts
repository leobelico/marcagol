// src/lib/rol.ts
//
// Reglas del armado de rol semanal que comparten el panel del capitán,
// el admin y las rutas de API (sin dependencias de servidor).

export const DIAS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;

export const DIA_CORTO: Record<string, string> = {
  MONDAY: "Lun", TUESDAY: "Mar", WEDNESDAY: "Mié", THURSDAY: "Jue",
  FRIDAY: "Vie", SATURDAY: "Sáb", SUNDAY: "Dom",
};

export const DIA_LARGO: Record<string, string> = {
  MONDAY: "Lunes", TUESDAY: "Martes", WEDNESDAY: "Miércoles", THURSDAY: "Jueves",
  FRIDAY: "Viernes", SATURDAY: "Sábado", SUNDAY: "Domingo",
};

// Días por defecto si la liga no tiene días de juego configurados
export const DIAS_DEFAULT = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

export const MIN_OPCIONES = 5;
export const MAX_OPCIONES = 10;
export const MAX_BLOQUEOS = 8;

// Cancha rosa (las demás son verdes)
export const CANCHA_ROSA = 3;
export const NUM_CANCHAS = 3;

// La encuesta se abre los miércoles de 9:00 a 21:00 (hora del centro de México)
export const VENTANA = { dia: 3, desde: 9, hasta: 21 };

// México dejó el horario de verano: el centro del país es UTC-6 todo el año
const OFFSET_MX_HORAS = -6;

export type Opcion = { dia: string; hora: string; prioridad: number };
export type Casilla = { dia: string; hora: string };

export function claveCasilla(dia: string, hora: string) {
  return `${dia}|${hora}`;
}

/** Fecha "de pared" en CDMX representada como un Date en UTC. */
function ahoraMexico(now: Date) {
  return new Date(now.getTime() + OFFSET_MX_HORAS * 3600_000);
}

export function ventanaAbierta(now = new Date()) {
  const mx = ahoraMexico(now);
  const h = mx.getUTCHours() + mx.getUTCMinutes() / 60;
  return mx.getUTCDay() === VENTANA.dia && h >= VENTANA.desde && h < VENTANA.hasta;
}

/**
 * Lunes de la semana para la que se piden horarios: el lunes siguiente
 * a hoy (en CDMX). Se guarda como YYYY-MM-DDT00:00Z.
 */
export function semanaObjetivo(now = new Date()): Date {
  const mx = ahoraMexico(now);
  const d = new Date(Date.UTC(mx.getUTCFullYear(), mx.getUTCMonth(), mx.getUTCDate()));
  const dow = d.getUTCDay(); // 0 domingo
  const hastaLunes = ((8 - dow) % 7) || 7;
  d.setUTCDate(d.getUTCDate() + hastaLunes);
  return d;
}

/** Normaliza cualquier fecha YYYY-MM-DD al lunes de su semana. */
export function lunesDe(fecha: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;
  const d = new Date(`${fecha}T00:00:00Z`);
  if (isNaN(d.getTime())) return null;
  const dow = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - ((dow + 6) % 7));
  return d;
}

export function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Fecha real del partido: lunes de la semana + día + hora en CDMX. */
export function fechaPartido(semana: Date, dia: string, hora: string): Date {
  const idx = DIAS.indexOf(dia as (typeof DIAS)[number]); // 0 = lunes
  const [h, m] = hora.split(":").map(Number);
  return new Date(
    Date.UTC(semana.getUTCFullYear(), semana.getUTCMonth(), semana.getUTCDate() + idx, h - OFFSET_MX_HORAS, m)
  );
}

/** Día (MONDAY…) y hora "HH:MM" en CDMX de una fecha guardada. */
export function diaHoraDe(date: Date): Casilla {
  const mx = ahoraMexico(date);
  const dia = DIAS[(mx.getUTCDay() + 6) % 7];
  const hora = `${String(mx.getUTCHours()).padStart(2, "0")}:${String(mx.getUTCMinutes()).padStart(2, "0")}`;
  return { dia, hora };
}

export function ordenarHoras(horas: string[]) {
  return [...new Set(horas)].sort();
}

/**
 * Topes para que la selección quede variada (regla 4). Con 5 opciones
 * y un bloque de 2 horarios: máximo 2 por día y 3 en un horario (3/2).
 * Con más opciones los topes crecen en la misma proporción.
 */
export function topesSeleccion(n: number, numDias: number, numHoras: number) {
  const porDia = Math.min(numHoras, Math.max(2, Math.round(n * 0.4), Math.ceil(n / Math.max(numDias, 1))));
  const porHora =
    numHoras <= 1 ? n : Math.max(Math.ceil(n / numHoras), Math.round((n * 1.2) / numHoras));
  return { porDia, porHora };
}

export function maxBloqueos(numCasillas: number, numOpciones: number) {
  return Math.max(0, Math.min(MAX_BLOQUEOS, numCasillas - Math.max(numOpciones, MIN_OPCIONES)));
}

/**
 * Valida la selección del capitán. Devuelve la lista de errores (vacía
 * si todo está bien).
 */
export function validarSeleccion(
  opciones: Opcion[],
  bloqueos: Casilla[],
  dias: string[],
  horas: string[]
): string[] {
  const errores: string[] = [];
  const n = opciones.length;
  const validas = new Set(dias.flatMap((d) => horas.map((h) => claveCasilla(d, h))));

  if (n < MIN_OPCIONES) errores.push(`Elige al menos ${MIN_OPCIONES} opciones (llevas ${n}).`);
  if (n > MAX_OPCIONES) errores.push(`Máximo ${MAX_OPCIONES} opciones.`);

  const vistas = new Set<string>();
  for (const o of [...opciones, ...bloqueos]) {
    const k = claveCasilla(o.dia, o.hora);
    if (!validas.has(k)) errores.push(`${DIA_LARGO[o.dia] ?? o.dia} ${o.hora} no es un horario de tu liga.`);
    if (vistas.has(k)) errores.push(`${DIA_LARGO[o.dia] ?? o.dia} ${o.hora} está repetido.`);
    vistas.add(k);
  }

  const prioridades = opciones.map((o) => o.prioridad).sort((a, b) => a - b);
  if (prioridades.some((p, i) => p !== i + 1)) {
    errores.push("Las prioridades deben ir del 1 al " + n + " sin saltos ni repetidos.");
  }

  if (n > 0) {
    const { porDia, porHora } = topesSeleccion(n, dias.length, horas.length);
    const cuentaDia: Record<string, number> = {};
    const cuentaHora: Record<string, number> = {};
    opciones.forEach((o) => {
      cuentaDia[o.dia] = (cuentaDia[o.dia] ?? 0) + 1;
      cuentaHora[o.hora] = (cuentaHora[o.hora] ?? 0) + 1;
    });
    for (const [d, c] of Object.entries(cuentaDia)) {
      if (c > porDia) errores.push(`Con ${n} opciones puedes elegir el ${DIA_LARGO[d] ?? d} máximo ${porDia} veces.`);
    }
    for (const [h, c] of Object.entries(cuentaHora)) {
      if (c > porHora) errores.push(`Con ${n} opciones puedes elegir las ${h} máximo ${porHora} veces; reparte en otros horarios.`);
    }
  }

  const tope = maxBloqueos(validas.size, n);
  if (bloqueos.length > tope) errores.push(`Puedes bloquear máximo ${tope} horarios.`);

  return errores;
}

/** Lee y limpia el JSON guardado (o recibido) de opciones/bloqueos. */
export function parseOpciones(v: unknown): Opcion[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((o) => o && typeof o.dia === "string" && typeof o.hora === "string" && Number.isInteger(o.prioridad))
    .map((o) => ({ dia: o.dia, hora: o.hora, prioridad: o.prioridad }));
}

export function parseCasillas(v: unknown): Casilla[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((o) => o && typeof o.dia === "string" && typeof o.hora === "string")
    .map((o) => ({ dia: o.dia, hora: o.hora }));
}

/** Nivel de demanda de una casilla: equipos que la pidieron vs. lugares. */
export function nivelSaturacion(equipos: number, lugares: number): "libre" | "solicitado" | "saturado" {
  if (lugares <= 0) return "saturado";
  const r = equipos / lugares;
  if (r >= 1) return "saturado";
  if (r >= 0.7) return "solicitado";
  return "libre";
}
