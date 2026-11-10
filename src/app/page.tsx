import Link from "next/link";
import type { ReactNode } from "react";
import ThemeToggle from "./components/ThemeToggle";
import CintaResultados from "./components/CintaResultados";
import ContadorHero from "./components/ContadorHero";
import CamarasModal from "./components/CamarasModal";
import LogoTlachtli from "./components/LogoTlachtli";

// La cinta de resultados lee partidos reales: regenerar cada 5 minutos
export const revalidate = 300;

// ─────────────────────────────────────────────────────────────
// Contenido
// ─────────────────────────────────────────────────────────────

const WHATSAPP = `https://wa.me/524443479221?text=${encodeURIComponent(
  "Hola, quiero usar Tlachtli en mi liga"
)}`;

const pasos = [
  {
    titulo: "Registra equipos",
    texto:
      "Das de alta los equipos y cada capitán recibe su acceso. Ellos suben a sus jugadores con foto e INE desde el celular.",
  },
  {
    titulo: "Genera el calendario",
    texto:
      "Todos contra todos, ida o ida y vuelta, con tus canchas, días de juego y el día que prefiere cada equipo. Listo en un clic.",
  },
  {
    titulo: "Captura en la cancha",
    texto:
      "Marcador, goles, asistencias y tarjetas desde la app, al terminar el partido. Las suspensiones por tarjeta se calculan solas.",
  },
  {
    titulo: "Todos lo ven al momento",
    texto:
      "Se actualizan la tabla, el goleo, la racha de cada equipo y la página pública. Si quieres, el calendario les llega por WhatsApp.",
  },
];

const perfiles = [
  {
    quien: "Organizador",
    titulo: "Tu liga sin Excel",
    puntos: [
      "Calendario automático y partidos manuales",
      "Liguilla que se arma sola desde la tabla",
      "Árbitros, pagos y evaluaciones",
      "Ingresos, gastos y balance por torneo",
    ],
  },
  {
    quien: "Capitán",
    titulo: "Su equipo en su celular",
    puntos: [
      "Registra jugadores con foto, INE y número",
      "Sube el logo del equipo",
      "Ve quién está suspendido y hasta qué jornada",
      "Maneja varios equipos y ligas con una cuenta",
    ],
  },
  {
    quien: "Afición",
    titulo: "Como una app de resultados",
    puntos: [
      "Partidos del día con marcador en vivo",
      "Tabla con zona de liguilla y últimos 5",
      "Tabla de goleo y fichas de jugador",
      "Página propia de tu torneo",
    ],
  },
];

const grupos: { titulo: string; items: { t: string; d: string }[] }[] = [
  {
    titulo: "Competencia",
    items: [
      { t: "Calendario automático", d: "Respeta días de juego, partidos por día, duración y el día preferido de cada equipo. Te avisa si algún cruce no cupo." },
      { t: "Partidos manuales", d: "Agrega un partido suelto, muévelo de jornada o elimínalo. Te avisa si dos equipos ya se enfrentaron o si la cancha está ocupada." },
      { t: "Liguilla automática", d: "Toma los primeros lugares, arma 1° contra último y genera cada ronda con los ganadores. En empates tú decides quién avanza." },
      { t: "Tabla, goleo y racha", d: "Puntos, diferencia de goles, últimos cinco resultados y líderes de goleo, siempre al día." },
    ],
  },
  {
    titulo: "Equipos y jugadores",
    items: [
      { t: "Portal del capitán", d: "Cada capitán administra solo sus equipos: plantilla, fotos, logo, INE y documento oficial." },
      { t: "Cierre de inscripciones", d: "Cierra el registro cuando arranque el torneo y da permiso de registro tardío al equipo que lo necesite." },
      { t: "Suspensiones y descalificación", d: "Las tarjetas generan suspensiones por jornada. Si descalificas a un equipo, sus partidos pendientes se cancelan solos." },
      { t: "Trae equipos de otro torneo", d: "Importa un equipo completo, con jugadores y capitán, sin volver a capturar nada." },
    ],
  },
  {
    titulo: "Operación",
    items: [
      { t: "Árbitros", d: "Regístralos con su pago por partido, asígnalos a cada juego y consulta cuánto se le debe a cada uno." },
      { t: "Evaluación arbitral", d: "Los capitanes califican al árbitro después de cada partido y tú ves un ranking con promedios y comentarios." },
      { t: "Finanzas", d: "Cuotas de equipo, renta de cancha, arbitraje, trofeos y premios con su balance del torneo." },
      { t: "Avisos por WhatsApp", d: "Manda el calendario a los capitanes de todos los equipos con un botón." },
    ],
  },
  {
    titulo: "Presencia",
    items: [
      { t: "Página de tu torneo", d: "Cada torneo tiene su dirección propia, como tuliga.marcagol.site, con tabla, calendario y goleo." },
      { t: "Flyer de inscripción", d: "Publica costo, cupo, fecha de cierre, contacto y redes para conseguir equipos." },
      { t: "Modo claro y oscuro", d: "La web y la app se adaptan al teléfono de cada quien, de día en la cancha o de noche en casa." },
      { t: "Varias ligas, un lugar", d: "Organiza tus torneos en carpetas y da acceso de administrador a quien te ayuda en cada uno." },
    ],
  },
];

const testimonios = [
  {
    liga: "Liga Norte Intersemanal",
    rol: "Organizador",
    equipos: "18 equipos",
    texto:
      "Antes llevábamos todo en hojas de cálculo distintas para cada torneo. Ahora tengo mis 4 ligas organizadas en un solo lugar y genero el calendario en minutos.",
  },
  {
    liga: "Liga Femenil Infantil",
    rol: "Capitana",
    equipos: "1 equipo",
    texto:
      "Puedo subir la foto y la documentación de cada jugadora desde el celular. Ya no tengo que mandarle todo por WhatsApp al organizador.",
  },
  {
    liga: "Copa Regional Veteranos",
    rol: "Organizador",
    equipos: "32 equipos",
    texto:
      "Lo que más me sirvió fue poder traer un equipo completo de un torneo anterior con un clic, en vez de capturar jugador por jugador otra vez.",
  },
];

const equipo = [
  { nombre: "Leonardo Mendoza", rol: "Desarrollo", numero: "1", posicion: "Portero", tel: "4443479221" },
  { nombre: "Ulises Salazar", rol: "Ventas", numero: "10", posicion: "Mediocampo", tel: null },
  { nombre: "Jorge Ruiz", rol: "Ventas", numero: "9", posicion: "Delantero", tel: null },
];

const incluye = [
  "Equipos y jugadores ilimitados",
  "Calendario automático y liguilla",
  "Resultados, tabla y goleo en vivo",
  "Portal y app para capitanes",
  "Árbitros, evaluaciones y finanzas",
  "Página pública y flyer del torneo",
  "Avisos por WhatsApp",
  "Web y app iOS / Android",
];

const faqs = [
  {
    q: "¿Cuánto cuesta?",
    a: "$200 MXN al mes por torneo activo. Si manejas varios torneos, pagas solo por los que estén en juego; por ejemplo, 10 torneos activos son $2,000 al mes.",
  },
  {
    q: "¿Necesito instalar algo?",
    a: "No. El panel funciona en cualquier navegador. La app móvil es opcional y sirve para capturar resultados y administrar desde la cancha.",
  },
  {
    q: "¿Qué pueden hacer los capitanes?",
    a: "Solo administran sus propios equipos: jugadores, fotos, logo y documentos. No pueden tocar resultados, calendario ni otros equipos. Una misma cuenta sirve si son capitanes en varias ligas.",
  },
  {
    q: "¿Cómo funciona la liguilla?",
    a: "Eliges cuántos equipos clasifican y Tlachtli arma los cruces con la tabla: 1° contra último, 2° contra penúltimo y así. Al terminar cada ronda genera la siguiente con los ganadores; en empates tú eliges quién avanza.",
  },
  {
    q: "¿Puedo guardar el INE de los jugadores?",
    a: "Sí. Cada jugador puede tener foto, INE y documento oficial, y solo el organizador y el capitán de ese equipo pueden verlos.",
  },
  {
    q: "¿Puedo traer un equipo de un torneo anterior?",
    a: "Sí. Importas el equipo completo con sus jugadores y su capitán desde cualquier otro torneo, sin capturar de nuevo.",
  },
  {
    q: "¿La afición tiene que crear cuenta?",
    a: "No. La página de tu torneo y la app son públicas para consultar partidos, tabla y goleo. Solo organizadores y capitanes inician sesión.",
  },
  {
    q: "¿Puedo cancelar?",
    a: "Sí, cuando quieras. Pagas mes con mes por los torneos que tengas activos.",
  },
];

// ─────────────────────────────────────────────────────────────
// Maquetas (pantallas de ejemplo de la app)
// ─────────────────────────────────────────────────────────────

const EQ: Record<string, [string, string]> = {
  HAL: ["Halcones FC", "#E2342D"],
  CUM: ["Real Cumbres", "#2F64E0"],
  MIT: ["Deportivo Mitras", "#0E9F6E"],
  RAY: ["Rayos de Apodaca", "#D99A00"],
  TCH: ["Club Topo Chico", "#7A3FD1"],
  ALV: ["Atl. Linda Vista", "#EE7A1E"],
  JSN: ["Juventud San Nicolás", "#0FA3B1"],
  LEO: ["Leones del Obispado", "#8B5E34"],
};

function Escudo({ k, size = 18 }: { k: string; size?: number }) {
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full font-extrabold text-[#fff]"
      style={{ width: size, height: size, background: EQ[k][1], fontSize: size * 0.36 }}
    >
      {k}
    </span>
  );
}

function Telefono({ tema, children, className = "" }: { tema: "light" | "dark"; children: ReactNode; className?: string }) {
  return (
    <div
      data-theme={tema}
      className={`w-[260px] shrink-0 rounded-[38px] bg-[#0b0d10] p-2 shadow-[0_30px_70px_-30px_rgba(10,20,40,.55)] ${className}`}
    >
      <div className="flex h-[520px] flex-col overflow-hidden rounded-[30px] bg-gray-950 text-[12px] text-white">
        {children}
      </div>
    </div>
  );
}

function BarraEstado() {
  return (
    <div className="flex h-7 shrink-0 items-center justify-between bg-[var(--mg-header)] px-5 text-[10.5px] font-semibold text-white">
      <span>7:42</span>
      <span>●●● 87%</span>
    </div>
  );
}

function BarraTabs({ activa }: { activa: string }) {
  return (
    <div className="mt-auto flex shrink-0 justify-around border-t border-gray-800 bg-gray-900 pb-4 pt-2 text-[9.5px] font-semibold text-gray-500">
      {["Ligas", "Perfil"].map((t) => (
        <span key={t} className={`flex flex-col items-center gap-1 ${t === activa ? "text-green-500" : ""}`}>
          <span className={`block h-4 w-4 rounded-[5px] border-2 border-current ${t === activa ? "bg-current" : ""}`} />
          {t}
        </span>
      ))}
    </div>
  );
}

function FilaPartido({
  estado,
  vivo,
  h,
  a,
  hs,
  as,
}: {
  estado: string;
  vivo?: boolean;
  h: string;
  a: string;
  hs?: number;
  as?: number;
}) {
  const fin = hs != null && !vivo;
  return (
    <div className="flex items-center gap-2 border-t border-gray-800 py-2 pr-3 first:border-t-0">
      <span className={`w-11 text-center text-[10px] font-semibold ${vivo ? "text-[var(--mg-live)]" : "text-gray-500"}`}>
        {estado}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {[h, a].map((k, i) => {
          const pierde = fin && (i === 0 ? hs! < as! : as! < hs!);
          return (
            <span key={k} className={`flex items-center gap-1.5 truncate ${pierde ? "text-gray-500" : "font-semibold"}`}>
              <Escudo k={k} size={16} />
              <span className="truncate">{EQ[k][0]}</span>
            </span>
          );
        })}
      </div>
      {hs != null && (
        <div className={`flex flex-col gap-1.5 text-right font-score text-[13px] font-bold tabular-nums ${vivo ? "text-[var(--mg-live)]" : ""}`}>
          <span className={fin && hs < as! ? "text-gray-500" : ""}>{hs}</span>
          <span className={fin && as! < hs ? "text-gray-500" : ""}>{as}</span>
        </div>
      )}
    </div>
  );
}

function PantallaPartidos() {
  return (
    <>
      <BarraEstado />
      <div className="shrink-0 bg-[var(--mg-header)] px-4 pb-3 pt-1">
        <p className="text-[15px] font-extrabold">Liga Del Valle</p>
        <div className="mt-2 flex gap-1.5 text-center text-[9.5px] font-semibold text-gray-500">
          {[["VIE", "14"], ["HOY", "15"], ["DOM", "16"], ["LUN", "17"]].map(([d, n]) => (
            <span key={n} className={`flex-1 rounded-lg py-1 ${d === "HOY" ? "bg-green-600 text-white" : ""}`}>
              {d}
              <b className="block font-score text-[13px] text-white">{n}</b>
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 p-2">
        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
          <p className="border-b border-gray-800 px-3 py-2 text-[10.5px] font-bold">
            Jornada 10 <span className="font-medium text-gray-500">· Primera fuerza</span>
          </p>
          <FilaPartido estado="67'" vivo h="HAL" a="CUM" hs={2} as={1} />
          <FilaPartido estado="Final" h="TCH" a="ALV" hs={1} as={3} />
          <FilaPartido estado="20:00" h="MIT" a="RAY" />
          <FilaPartido estado="21:00" h="JSN" a="LEO" />
        </div>
      </div>
      <BarraTabs activa="Ligas" />
    </>
  );
}

function PantallaTabla() {
  const filas: [string, string, number, string][] = [
    ["HAL", "+15", 22, "GGEGG"],
    ["CUM", "+9", 20, "GEGGP"],
    ["MIT", "+5", 17, "EGPGG"],
    ["RAY", "+2", 15, "GEEPG"],
    ["TCH", "−3", 11, "PGEPP"],
    ["ALV", "−5", 9, "EPGEG"],
    ["JSN", "−9", 4, "PPEPP"],
  ];
  const color: Record<string, string> = { G: "var(--mg-win)", E: "var(--mg-draw)", P: "var(--mg-loss)" };
  return (
    <>
      <BarraEstado />
      <div className="shrink-0 bg-[var(--mg-header)] px-4 pt-1">
        <p className="text-[15px] font-extrabold">Liga Del Valle</p>
        <div className="mt-2 flex gap-4 text-[10.5px] font-bold text-gray-500">
          <span className="pb-2">Inicio</span>
          <span className="border-b-2 border-green-500 pb-2 text-white">Tabla</span>
          <span className="pb-2">Goleo</span>
          <span className="pb-2">Calendario</span>
        </div>
      </div>
      <div className="p-2">
        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
          <div className="flex border-b border-gray-800 px-2 py-1.5 text-[9px] font-semibold text-gray-500">
            <span className="w-6 text-center">#</span>
            <span className="flex-1">Equipo</span>
            <span className="w-7 text-center">PTS</span>
            <span className="w-[62px] text-center">Últimos 5</span>
          </div>
          {filas.map(([k, , pts, f], i) => (
            <div key={k} className="flex items-center border-b border-gray-800 px-2 py-1.5 last:border-b-0">
              <span className="w-6 text-center">
                <span
                  className={`inline-grid h-[18px] w-[18px] place-items-center rounded-[5px] text-[9.5px] font-bold ${
                    i < 4 ? "bg-green-600 text-white" : "text-gray-400"
                  }`}
                >
                  {i + 1}
                </span>
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-1.5 font-semibold">
                <Escudo k={k} size={15} />
                <span className="truncate">{EQ[k][0]}</span>
              </span>
              <span className="w-7 text-center font-score text-[12.5px] font-bold tabular-nums">{pts}</span>
              <span className="flex w-[62px] justify-center gap-[2px]">
                {[...f].map((r, j) => (
                  <span key={j} className="grid h-[11px] w-[11px] place-items-center rounded-[3px] text-[6.5px] font-extrabold text-[#fff]" style={{ background: color[r] }}>
                    {r}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
      <BarraTabs activa="Ligas" />
    </>
  );
}

function PantallaPanel() {
  const menu: [string, string, string][] = [
    ["Resultados", "3 partidos sin capturar", "var(--mg-live)"],
    ["Calendario", "Jornada 10 de 14", "#60A5FA"],
    ["Liguilla", "Crear cuartos de final", "#D99A00"],
    ["Árbitros", "2 partidos sin asignar", "#C084FC"],
    ["Finanzas", "Balance $18,400", "var(--mg-win)"],
  ];
  return (
    <>
      <BarraEstado />
      <div className="shrink-0 bg-[var(--mg-header)] px-4 pb-3 pt-1">
        <p className="text-[10px] font-semibold text-gray-400">Gestionar torneo</p>
        <p className="text-[15px] font-extrabold">Liga Del Valle</p>
      </div>
      <div className="flex flex-col gap-2 p-2">
        <div className="grid grid-cols-3 gap-1.5">
          {[["8", "Equipos"], ["56", "Partidos"], ["14", "Jornadas"]].map(([n, l]) => (
            <div key={l} className="rounded-lg border border-gray-800 bg-gray-900 p-2">
              <p className="text-[8.5px] font-semibold uppercase tracking-wide text-gray-500">{l}</p>
              <p className="font-score text-[20px] font-bold leading-none">{n}</p>
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
          {menu.map(([t, d, c]) => (
            <div key={t} className="flex items-center gap-2.5 border-b border-gray-800 px-3 py-2 last:border-b-0">
              <span className="h-6 w-6 shrink-0 rounded-md" style={{ background: c, opacity: 0.85 }} />
              <span className="flex-1">
                <b className="block text-[11.5px]">{t}</b>
                <span className="text-[9.5px] text-gray-500">{d}</span>
              </span>
              <span className="text-gray-500">›</span>
            </div>
          ))}
        </div>
      </div>
      <BarraTabs activa="Perfil" />
    </>
  );
}

function PantallaCapitan() {
  const jugadores: [string, string, boolean, boolean, string?][] = [
    ["7", "Luis Treviño", true, true],
    ["10", "Emiliano Rodríguez", true, true],
    ["4", "Diego Salinas", true, false, "Suspendido hasta J11"],
    ["1", "Óscar Villarreal", true, true],
    ["9", "Mauricio Garza", false, false],
  ];
  return (
    <>
      <BarraEstado />
      <div className="shrink-0 bg-[var(--mg-header)] px-4 pb-3 pt-1">
        <p className="text-[15px] font-extrabold">Mi equipo</p>
      </div>
      <div className="flex flex-col gap-2 p-2">
        <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-3">
          <Escudo k="HAL" size={40} />
          <div>
            <p className="text-[14px] font-extrabold">Halcones FC</p>
            <p className="text-[10px] font-semibold text-green-500">Liga Del Valle</p>
            <p className="text-[10px] text-gray-500">18 jugadores</p>
          </div>
        </div>
        {jugadores.map(([n, nombre, foto, ine, nota]) => (
          <div key={n} className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900 px-2.5 py-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gray-800 font-score text-[11px] font-bold">{n}</span>
            <span className="min-w-0 flex-1">
              <b className="block truncate text-[11.5px]">{nombre}</b>
              <span className="flex gap-2 text-[9.5px] font-semibold">
                <span style={{ color: foto ? "var(--mg-win)" : undefined }} className={foto ? "" : "text-gray-500"}>{foto ? "✓" : "✗"} Foto</span>
                <span style={{ color: ine ? "var(--mg-win)" : undefined }} className={ine ? "" : "text-gray-500"}>{ine ? "✓" : "✗"} INE</span>
                {nota && <span className="text-[var(--mg-loss)]">{nota}</span>}
              </span>
            </span>
          </div>
        ))}
      </div>
      <BarraTabs activa="Perfil" />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────

function Etiqueta({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-[0.14em] text-green-500">{children}</p>;
}

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-green-500" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

const contenedor = "mx-auto w-full max-w-6xl px-[max(20px,env(safe-area-inset-left,0px))]";
const btnPrimario =
  "inline-flex items-center justify-center rounded-xl bg-green-600 px-6 py-3.5 text-[15px] font-bold text-white shadow-sm transition hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500";
const btnSecundario =
  "inline-flex items-center justify-center rounded-xl border border-gray-700 bg-gray-900 px-6 py-3.5 text-[15px] font-bold text-white transition hover:border-gray-600";

export default function LandingPage() {
  return (
    <main data-landing className="min-h-screen overflow-x-hidden bg-gray-950 text-white">
      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-gray-800 bg-gray-900/85 backdrop-blur" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className={`${contenedor} flex h-16 items-center gap-6`}>
          <Link href="/" className="flex items-center" aria-label="Tlachtli, inicio">
            <LogoTlachtli className="h-7 w-auto" />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-gray-400 md:flex">
            <a href="#funciones" className="hover:text-white">Funciones</a>
            <a href="#app" className="hover:text-white">App</a>
            <a href="#liguilla" className="hover:text-white">Liguilla</a>
            <a href="#precio" className="hover:text-white">Precio</a>
            <a href="#preguntas" className="hover:text-white">Preguntas</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-gray-400 hover:text-white sm:block">
              Entrar
            </Link>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700">
              Quiero mi liga
            </a>
          </div>
        </div>
      </header>

      {/* CINTA DE RESULTADOS */}
      <CintaResultados />

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Fondo: franjas de pasto + cancha que se dibuja + balón */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                "repeating-linear-gradient(90deg, transparent 0 64px, color-mix(in oklab, var(--mg-accent) 4%, transparent) 64px 128px)",
              maskImage: "linear-gradient(to bottom, black 55%, transparent)",
              WebkitMaskImage: "linear-gradient(to bottom, black 55%, transparent)",
            }}
          />
          <div
            className="absolute inset-x-0 top-0 h-[520px]"
            style={{ background: "radial-gradient(70% 60% at 70% 0%, color-mix(in oklab, var(--mg-accent) 16%, transparent), transparent 70%)" }}
          />
          <svg
            className="mg-cancha absolute inset-0 h-full w-full"
            viewBox="0 0 1200 640"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
            stroke="var(--mg-accent)"
            strokeOpacity="0.2"
            strokeWidth="2"
          >
            <rect x="40" y="40" width="1120" height="560" rx="6" />
            <line x1="600" y1="40" x2="600" y2="600" />
            <circle cx="600" cy="320" r="90" />
            <rect x="40" y="170" width="150" height="300" />
            <rect x="40" y="250" width="56" height="140" />
            <path d="M190 260 A70 70 0 0 1 190 380" />
            <rect x="1010" y="170" width="150" height="300" />
            <rect x="1104" y="250" width="56" height="140" />
            <path d="M1010 260 A70 70 0 0 0 1010 380" />
          </svg>
          <svg
            className="mg-balon absolute left-1/2 top-1/2 -ml-3 -mt-3 h-6 w-6 opacity-80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="12" cy="12" r="10" className="fill-gray-950" />
            <path d="M12 7.5l4 2.9-1.5 4.7h-5L8 10.4z" fill="currentColor" />
          </svg>
        </div>

        <div className={`${contenedor} relative grid items-center gap-14 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24`}>
          <div>
            <div className="mg-up">
              <Etiqueta>Para ligas de fútbol amateur</Etiqueta>
            </div>
            <h1
              className="mg-up mt-4 t-titulo text-[clamp(48px,8vw,96px)] [text-wrap:balance]"
              style={{ animationDelay: "80ms" }}
            >
              Tu liga, con marcador en vivo y tabla al instante.
            </h1>
            <p className="mg-up mt-6 max-w-[54ch] text-lg leading-relaxed text-gray-400" style={{ animationDelay: "160ms" }}>
              Tlachtli arma el calendario y lleva resultados, tabla, goleo y liguilla. Tú capturas desde el celular en
              la cancha; los capitanes y la afición lo ven al momento, como en las apps de resultados.
            </p>
            <div className="mg-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className={btnPrimario}>
                Quiero mi liga en Tlachtli
              </a>
              <a href="#funciones" className={btnSecundario}>
                Ver qué hace
              </a>
            </div>
            <dl
              className="mg-up mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-gray-800 pt-6"
              style={{ animationDelay: "320ms" }}
            >
              {(
                [
                  [<ContadorHero key="p" valor={200} prefijo="$" />, "MXN al mes por torneo"],
                  ["Web + app", "iOS y Android"],
                  ["1 clic", "para el calendario"],
                ] as [ReactNode, string][]
              ).map(([n, l]) => (
                <div key={l}>
                  <dt className="font-score text-[26px] font-bold leading-none">{n}</dt>
                  <dd className="mt-1.5 text-xs text-gray-500">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mg-tel-in relative flex justify-center lg:justify-end">
            <div className="flex items-end">
              <Telefono tema="light" className="relative z-10 -rotate-3">
                <PantallaPartidos />
              </Telefono>
              <Telefono tema="dark" className="-ml-16 hidden translate-y-10 rotate-3 sm:block">
                <PantallaTabla />
              </Telefono>
            </div>
          </div>
        </div>
      </section>

      <div className="t-escalones" aria-hidden="true" />

      {/* CÓMO FUNCIONA */}
      <section className="border-b border-gray-800 bg-gray-900">
        <div className={`${contenedor} py-20`}>
          <Etiqueta>Así va un fin de semana</Etiqueta>
          <h2 className="mt-3 max-w-2xl t-titulo text-[clamp(36px,5vw,56px)] [text-wrap:balance]">
            De la inscripción al pitazo final, sin hojas de cálculo ni grupos de WhatsApp.
          </h2>
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {pasos.map((p, i) => (
              <li key={p.titulo} className="flex flex-col gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-green-500 font-score text-lg font-bold text-green-500">
                  {i + 1}
                </span>
                <h3 className="text-lg font-bold">{p.titulo}</h3>
                <p className="text-[15px] leading-relaxed text-gray-400">{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PERFILES */}
      <section className={`${contenedor} py-24`}>
        <Etiqueta>Una plataforma, tres vistas</Etiqueta>
        <h2 className="mt-3 max-w-2xl t-titulo text-[clamp(36px,5vw,56px)] [text-wrap:balance]">
          Cada quien ve exactamente lo que necesita.
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {perfiles.map((p) => (
            <div key={p.quien} className="flex flex-col rounded-2xl border border-gray-800 bg-gray-900 p-7">
              <p className="text-sm font-bold text-green-500">{p.quien}</p>
              <h3 className="t-titulo mt-1 text-3xl">{p.titulo}</h3>
              <ul className="mt-6 flex flex-col gap-3 text-[15px] text-gray-300">
                {p.puntos.map((x) => (
                  <li key={x} className="flex gap-2.5">
                    <Check />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* APP */}
      <section id="app" className="scroll-mt-20 overflow-hidden border-y border-gray-800 bg-gray-900">
        <div className={`${contenedor} grid items-center gap-14 py-24 lg:grid-cols-2`}>
          <div className="order-2 flex justify-center gap-5 lg:order-1">
            <Telefono tema="dark" className="hidden sm:block">
              <PantallaPanel />
            </Telefono>
            <Telefono tema="light" className="sm:translate-y-12">
              <PantallaCapitan />
            </Telefono>
          </div>
          <div className="order-1 lg:order-2">
            <Etiqueta>App móvil</Etiqueta>
            <h2 className="mt-3 t-titulo text-[clamp(36px,5vw,56px)] [text-wrap:balance]">
              La liga completa en tu bolsillo.
            </h2>
            <p className="mt-5 max-w-[50ch] text-lg leading-relaxed text-gray-400">
              Todo lo que haces en la web también lo haces desde el celular: capturar resultados, generar el calendario,
              armar la liguilla o registrar un árbitro, parado junto a la cancha.
            </p>
            <ul className="mt-8 flex flex-col gap-4 text-[15px]">
              {[
                ["Captura en segundos", "Marcador, goleadores, asistencias y tarjetas con el minuto de cada jugada."],
                ["Portal del capitán", "Cada capitán sube a sus jugadores con foto e INE y ve quién está suspendido."],
                ["Modo claro y oscuro", "Legible a pleno sol en la cancha y cómodo de noche."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <Check />
                  <span>
                    <b className="font-bold">{t}.</b> <span className="text-gray-400">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FUNCIONES */}
      <section id="funciones" className={`${contenedor} scroll-mt-20 py-24`}>
        <Etiqueta>Funciones</Etiqueta>
        <h2 className="mt-3 max-w-2xl t-titulo text-[clamp(36px,5vw,56px)] [text-wrap:balance]">
          Todo lo que tu liga necesita, en un solo lugar.
        </h2>
        <div className="mt-12 grid gap-x-10 gap-y-14 md:grid-cols-2">
          {grupos.map((g) => (
            <div key={g.titulo}>
              <h3 className="border-b border-gray-800 pb-3 text-sm font-bold uppercase tracking-[0.12em] text-gray-500">
                {g.titulo}
              </h3>
              <dl className="mt-5 flex flex-col gap-5">
                {g.items.map((it) => (
                  <div key={it.t}>
                    <dt className="font-bold">{it.t}</dt>
                    <dd className="mt-1 text-[15px] leading-relaxed text-gray-400">{it.d}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>

      {/* LIGUILLA */}
      <section id="liguilla" className="scroll-mt-20 border-y border-gray-800 bg-gray-900">
        <div className={`${contenedor} grid items-center gap-12 py-24 lg:grid-cols-[1fr_1.1fr]`}>
          <div>
            <Etiqueta>Liguilla</Etiqueta>
            <h2 className="mt-3 t-titulo text-[clamp(36px,5vw,56px)] [text-wrap:balance]">
              La liguilla se arma sola.
            </h2>
            <p className="mt-5 max-w-[50ch] text-lg leading-relaxed text-gray-400">
              Eliges cuántos clasifican y Tlachtli toma la tabla: 1° contra 8°, 2° contra 7°. Cuando termina la ronda,
              genera la siguiente con los ganadores, ordenados otra vez por su lugar en la tabla. En los empates, tú
              decides quién pasa.
            </p>
          </div>
          <div className="min-w-0 overflow-x-auto">
            <div className="grid min-w-[520px] grid-cols-3 items-center gap-4 text-sm">
              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Cuartos</p>
                {[["HAL", "LEO", 3, 0], ["CUM", "JSN", 2, 1], ["MIT", "ALV", 1, 1], ["RAY", "TCH", 0, 2]].map(([h, a, x, y]) => (
                  <Llave key={`${h}${a}`} h={h as string} a={a as string} hs={x as number} as={y as number} pen={h === "MIT"} />
                ))}
              </div>
              <div className="flex flex-col gap-16">
                <p className="-mb-12 text-xs font-bold uppercase tracking-wider text-gray-500">Semifinal</p>
                <Llave h="HAL" a="TCH" hs={2} as={1} />
                <Llave h="CUM" a="MIT" hs={0} as={1} />
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Final</p>
                <Llave h="HAL" a="MIT" />
                <p className="text-xs text-gray-500">Sábado 13 de diciembre · 20:00</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TLACHTLI TV (próximamente) */}
      <section id="tv" className={`${contenedor} scroll-mt-20 py-24`}>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Etiqueta>Tlachtli TV</Etiqueta>
              <span className="rounded-full border border-gray-700 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Próximamente
              </span>
            </div>
            <h2 className="mt-3 t-titulo text-[clamp(36px,5vw,56px)] [text-wrap:balance]">
              Tus partidos en video, y cada gol en un clip.
            </h2>
            <p className="mt-5 max-w-[50ch] text-lg leading-relaxed text-gray-400">
              Instalamos una cámara en tu cancha. Los partidos se transmiten en vivo y se quedan guardados. Cada gol que
              capturas en Tlachtli se convierte en un clip que le llega al jugador para compartirlo.
            </p>
            <ul className="mt-6 grid gap-2.5 text-gray-300">
              {[
                "Transmisión en vivo con el marcador encima",
                "Clips de goles automáticos, sin editar nada",
                "Las mejores jugadas de cada jugador en su ficha",
                "Espacio para el logo de tus patrocinadores",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                  {t}
                </li>
              ))}
            </ul>
            <CamarasModal className={`${btnPrimario} mt-8`}>
              Quiero cámaras en mi liga
            </CamarasModal>
          </div>

          {/* Maqueta: transmisión con marcador y clips */}
          <div className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl">
              <div
                className="relative aspect-video w-full"
                style={{ background: "repeating-linear-gradient(90deg,#2f8a4a 0 12.5%,#2a7d43 12.5% 25%)" }}
                aria-hidden
              >
                <div className="absolute inset-[8%_5%] rounded-sm border-2 border-white/50">
                  <div className="absolute inset-y-0 left-1/2 border-l-2 border-white/50" />
                  <div className="absolute left-1/2 top-1/2 aspect-square w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/50" />
                  <div className="absolute inset-y-[30%] left-0 w-[12%] border-2 border-l-0 border-white/50" />
                  <div className="absolute inset-y-[30%] right-0 w-[12%] border-2 border-r-0 border-white/50" />
                </div>
                <div className="absolute left-3 top-3 flex overflow-hidden rounded-md font-score text-sm font-bold text-white shadow">
                  <span className="bg-[#12261a] px-2 py-1">HAL</span>
                  <span className="bg-white px-2 py-1 tabular-nums text-[#12261a]">2-1</span>
                  <span className="bg-[#12261a] px-2 py-1">CUM</span>
                  <span className="bg-[var(--mg-live)] px-2 py-1">38&apos;</span>
                </div>
                <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-[var(--mg-live)] px-2 py-1 text-[11px] font-bold text-white">
                  <span className="mg-vivo-punto h-1.5 w-1.5 rounded-full bg-white" />
                  EN VIVO
                </span>
                <span className="absolute bottom-3 right-3 rounded-md bg-black/55 px-2 py-1 text-[11px] font-semibold text-white">
                  Tu patrocinador aquí
                </span>
                <span className="absolute left-[46%] top-[52%] h-2 w-2 rounded-full bg-yellow-300 shadow-[0_0_8px_#fde047]" />
              </div>
              <ul className="divide-y divide-gray-800 text-sm">
                {[
                  ["34'", "⚽", "Iván Treviño", "Halcones FC"],
                  ["23'", "⚽", "Marco Leal", "Real Cumbres"],
                  ["11'", "⚽", "Iván Treviño", "Halcones FC"],
                ].map(([min, ico, nombre, equipo]) => (
                  <li key={`${min}${nombre}`} className="flex items-center gap-3 px-5 py-3">
                    <span className="w-8 font-score font-bold tabular-nums text-gray-500">{min}</span>
                    <span aria-hidden>{ico}</span>
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-semibold">{nombre}</span> <span className="text-gray-500">{equipo}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-500">▶ Clip</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ORGANIZACIONES */}
      <section className={`${contenedor} py-24`}>
        <div className="grid gap-10 rounded-3xl border border-gray-800 bg-gray-900 p-8 md:grid-cols-[1.2fr_1fr] md:p-12">
          <div>
            <Etiqueta>Para organizaciones</Etiqueta>
            <h2 className="mt-3 t-titulo text-[clamp(32px,4.5vw,48px)] [text-wrap:balance]">
              ¿Manejas varias ligas? Todas caben aquí.
            </h2>
            <p className="mt-4 max-w-[52ch] text-gray-400">
              Agrupa tus torneos en carpetas, da acceso de administrador a quien te ayuda en cada uno y trae equipos de
              una temporada a otra sin volver a capturar.
            </p>
          </div>
          <div className="flex flex-col justify-center rounded-2xl border border-gray-800 bg-gray-950 p-6">
            <p className="text-sm text-gray-500">Ejemplo: 10 torneos activos</p>
            <p className="mt-1 font-score text-5xl font-bold">$2,000</p>
            <p className="mt-1 text-sm text-gray-500">MXN al mes, sin pagar por equipo ni por jugador</p>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="border-y border-gray-800 bg-gray-900">
        <div className={`${contenedor} py-24`}>
          <Etiqueta>Lo que dicen</Etiqueta>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {testimonios.map((t) => (
              <figure key={t.liga} className="flex flex-col rounded-2xl border border-gray-800 bg-gray-950 p-7">
                <blockquote className="flex-1 text-[15px] leading-relaxed text-gray-300">“{t.texto}”</blockquote>
                <figcaption className="mt-6 border-t border-gray-800 pt-4 text-sm">
                  <b className="block">{t.liga}</b>
                  <span className="text-gray-500">
                    {t.rol} · {t.equipos}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* PRECIO */}
      <section id="precio" className={`${contenedor} scroll-mt-20 py-24`}>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Etiqueta>Precio</Etiqueta>
            <h2 className="mt-3 t-titulo text-[clamp(36px,5vw,56px)] [text-wrap:balance]">
              Un solo precio por torneo. Todo incluido.
            </h2>
            <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-gray-400">
              Sin paquetes ni cobros por equipo o jugador. Pagas solo por los torneos que tienes en juego y cancelas
              cuando quieras.
            </p>
          </div>
          <div className="rounded-3xl border-2 border-green-500 bg-gray-900 p-8 md:p-10">
            <p className="text-sm font-bold text-green-500">Por torneo activo</p>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="font-score text-7xl font-bold leading-none">$200</span>
              <span className="text-gray-500">MXN / mes</span>
            </p>
            <ul className="mt-8 grid gap-3 text-[15px] sm:grid-cols-2">
              {incluye.map((x) => (
                <li key={x} className="flex gap-2.5">
                  <Check />
                  {x}
                </li>
              ))}
            </ul>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className={`${btnPrimario} mt-9 w-full`}>
              Empezar con mi liga
            </a>
          </div>
        </div>
      </section>

      {/* EQUIPO */}
      <section className="border-y border-gray-800 bg-gray-900">
        <div className={`${contenedor} py-24`}>
          <Etiqueta>Quiénes somos</Etiqueta>
          <h2 className="mt-3 max-w-2xl t-titulo text-[clamp(32px,4.5vw,48px)] [text-wrap:balance]">
            También jugamos los fines de semana.
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {equipo.map((p) => (
              <div key={p.nombre} className="flex items-center gap-4 rounded-2xl border border-gray-800 bg-gray-950 p-5">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-green-600 font-score text-2xl font-bold text-white">
                  {p.numero}
                </span>
                <div className="min-w-0">
                  <p className="font-bold">{p.nombre}</p>
                  <p className="text-sm text-gray-500">
                    {p.rol} · {p.posicion}
                  </p>
                  {p.tel && (
                    <a href={`https://wa.me/52${p.tel}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-semibold text-green-500 hover:underline">
                      WhatsApp {p.tel}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREGUNTAS */}
      <section id="preguntas" className={`${contenedor} scroll-mt-20 py-24`}>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <Etiqueta>Preguntas frecuentes</Etiqueta>
            <h2 className="mt-3 t-titulo text-[clamp(36px,5vw,56px)]">
              Antes de empezar
            </h2>
            <p className="mt-4 text-gray-400">
              ¿Tienes otra duda? Escríbenos por{" "}
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="font-semibold text-green-500 hover:underline">
                WhatsApp
              </a>
              .
            </p>
          </div>
          <div className="divide-y divide-gray-800 border-y border-gray-800">
            {faqs.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-bold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="text-xl text-gray-500 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-[65ch] text-[15px] leading-relaxed text-gray-400">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className={`${contenedor} pb-24`}>
        <div className="relative overflow-hidden rounded-3xl bg-[var(--mg-header)] px-8 py-16 text-center md:px-16" data-theme="dark">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(60% 80% at 50% 0%, rgba(98,214,141,.22), transparent 70%)" }}
          />
          <h2 className="relative mx-auto max-w-2xl t-titulo text-[clamp(40px,6vw,72px)] text-white [text-wrap:balance]">
            Que tu liga se vea como profesional desde la próxima jornada.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-gray-300">
            Te ayudamos a dar de alta tu torneo y tus equipos. Empiezas a capturar el mismo fin de semana.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className={btnPrimario}>
              Escribir por WhatsApp
            </a>
            <Link href="/login" className={btnSecundario}>
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-800" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className={`${contenedor} flex flex-col gap-4 py-10 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between`}>
          <p>© {new Date().getFullYear()} Tlachtli · Un producto de KoatlCyber · Hecho en México para el fútbol amateur</p>
          <nav className="flex flex-wrap gap-5">
            <a href="#funciones" className="hover:text-white">Funciones</a>
            <a href="#precio" className="hover:text-white">Precio</a>
            <Link href="/privacidad" className="hover:text-white">Privacidad</Link>
            <Link href="/login" className="hover:text-white">Entrar</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function Llave({ h, a, hs, as, pen }: { h: string; a: string; hs?: number; as?: number; pen?: boolean }) {
  const jugado = hs != null && as != null;
  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
      {[
        [h, hs],
        [a, as],
      ].map(([k, n], i) => {
        const pierde = jugado && (pen ? i === 1 : i === 0 ? hs! < as! : as! < hs!);
        return (
          <div key={k as string} className={`flex items-center gap-2 px-3 py-2 ${i === 1 ? "border-t border-gray-800" : ""}`}>
            <Escudo k={k as string} size={18} />
            <span className={`flex-1 truncate text-[13px] ${pierde ? "text-gray-500" : "font-semibold"}`}>{EQ[k as string][0]}</span>
            {jugado && (
              <span className={`font-score text-[15px] font-bold tabular-nums ${pierde ? "text-gray-500" : ""}`}>
                {n as number}
                {pen && i === 0 ? "*" : ""}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
