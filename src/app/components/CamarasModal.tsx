"use client";

// MarcaGol TV: botón "Quiero cámaras en mi liga" que abre una ventana con
// lo que cuesta instalar cámaras en una cancha (equipo, gasto mensual,
// fases) y una calculadora de en cuánto tiempo se paga con patrocinios.
// Al final, el botón para cotizar por WhatsApp.
import { useEffect, useRef, useState } from "react";

const WHATSAPP_TV = `https://wa.me/524443479221?text=${encodeURIComponent(
  "Hola, me interesa MarcaGol TV (cámaras en mi cancha). ¿Me pasas una cotización?"
)}`;

const EQUIPO = [
  {
    que: "Cámara 4K panorámica 180°, exterior",
    para: "Ve toda la cancha desde un solo punto, de día y de noche",
    precio: "$4,000 – 6,500",
  },
  {
    que: "Mini computadora en la cancha",
    para: "Graba el partido, corta los clips, los sube y transmite",
    precio: "$3,500 – 5,000",
  },
  {
    que: "Disco de 1 TB",
    para: "Guarda varias semanas de partidos en la cancha",
    precio: "$1,200 – 2,000",
  },
  {
    que: "Cableado de corriente e internet",
    para: "Un solo cable lleva corriente e internet a la cámara",
    precio: "$800 – 1,500",
  },
  {
    que: "Poste o soporte, caja contra lluvia y no-break",
    para: "Altura para ver todo, protección y aguante en apagones cortos",
    precio: "$1,500 – 3,000",
  },
  {
    que: "Instalación",
    para: "Electricista y trabajo en altura, segura contra robo",
    precio: "$1,500 – 3,000",
  },
];

const MENSUAL = [
  {
    que: "Internet con buena subida",
    para: "Fibra si llega a la cancha; si no, satelital. Para transmitir en vivo se necesitan 5–10 Mbps de subida.",
    precio: "$500 – 1,350",
  },
  {
    que: "Guardado de clips en la nube",
    para: "Los clips pesan poco; los partidos completos se guardan unas semanas.",
    precio: "$100 – 400",
  },
];

const FASES = [
  {
    fase: "Fase 1",
    titulo: "Grabar y clips de goles",
    puntos: ["Cada partido queda grabado", "Clips automáticos de los goles", "Le llegan al jugador en la app"],
  },
  {
    fase: "Fase 2",
    titulo: "En vivo",
    puntos: ["Transmisión en vivo", "Marcador y minuto encima del video", "Logo de tus patrocinadores"],
  },
  {
    fase: "Fase 3",
    titulo: "Todas tus canchas",
    puntos: ["Video dentro de la app", "Venta del partido completo", "Resumen de temporada por jugador"],
  },
];

function pesos(n: number) {
  return `$${Math.round(n).toLocaleString("es-MX")}`;
}

function Campo({
  id,
  label,
  value,
  onChange,
  step = 100,
  min = 0,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <label htmlFor={id} className="grid gap-1.5">
      <span className="text-sm font-semibold text-gray-300">{label}</span>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        step={step}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
        className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3.5 py-2.5 font-bold tabular-nums text-white focus:border-green-500 focus:outline-none"
      />
    </label>
  );
}

export default function CamarasModal({ className, children }: { className?: string; children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const cerrarRef = useRef<HTMLButtonElement>(null);

  // Calculadora (valores de ejemplo, editables)
  const [canchas, setCanchas] = useState(1);
  const [equipo, setEquipo] = useState(17000);
  const [gasto, setGasto] = useState(1200);
  const [patrocinio, setPatrocinio] = useState(1500);
  const [otros, setOtros] = useState(500);

  // Escape cierra; bloquear el scroll de la página mientras está abierto
  useEffect(() => {
    if (!abierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cerrarRef.current?.focus();
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = previo;
      window.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  const c = Math.max(1, Math.round(canchas));
  const inversion = c * equipo;
  const sale = c * gasto;
  const entra = c * (patrocinio + otros);
  const ganancia = entra - sale;
  const meses = ganancia > 0 ? Math.ceil(inversion / ganancia) : null;

  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} className={className}>
        {children}
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setAbierto(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tv-titulo"
            onClick={(e) => e.stopPropagation()}
            className="mg-up relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-gray-800 bg-gray-900 shadow-2xl sm:rounded-3xl"
          >
            {/* Encabezado */}
            <div className="flex items-start justify-between gap-4 border-b border-gray-800 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-green-500">MarcaGol TV · Próximamente</p>
                <h2 id="tv-titulo" className="mt-1 text-2xl font-extrabold tracking-tight [text-wrap:balance]">
                  ¿Cuánto cuesta poner cámaras en tu cancha?
                </h2>
              </div>
              <button
                ref={cerrarRef}
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-800 text-gray-300 transition hover:bg-gray-700 hover:text-white focus-visible:outline-2 focus-visible:outline-green-500"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="space-y-9 overflow-y-auto px-6 py-6">
              {/* Cómo funciona */}
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Graba", "Una cámara en la cancha graba cada partido completo."],
                  ["Corta", "Cuando capturas un gol en MarcaGol, el clip se corta solo."],
                  ["Comparte", "El clip le llega al jugador en la app para subirlo a sus redes."],
                ].map(([t, d], i) => (
                  <div key={t} className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="mt-2 font-bold">{t}</p>
                    <p className="mt-1 text-sm text-gray-400">{d}</p>
                  </div>
                ))}
              </div>

              {/* Equipo */}
              <div>
                <h3 className="text-lg font-extrabold">Equipo por cancha</h3>
                <p className="mt-1 text-sm text-gray-400">Se paga una sola vez. Precios aproximados en pesos.</p>
                <ul className="mt-4 divide-y divide-gray-800 overflow-hidden rounded-2xl border border-gray-800 bg-gray-950">
                  {EQUIPO.map((e) => (
                    <li key={e.que} className="flex items-start justify-between gap-4 px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{e.que}</p>
                        <p className="text-sm text-gray-500">{e.para}</p>
                      </div>
                      <p className="shrink-0 whitespace-nowrap font-bold tabular-nums">{e.precio}</p>
                    </li>
                  ))}
                  <li className="flex items-center justify-between gap-4 bg-gray-900 px-4 py-3.5">
                    <p className="font-extrabold">Total por cancha</p>
                    <p className="whitespace-nowrap font-score text-2xl font-bold tabular-nums text-green-500">$12,500 – 21,000</p>
                  </li>
                </ul>
              </div>

              {/* Mensual */}
              <div>
                <h3 className="text-lg font-extrabold">Cada mes</h3>
                <ul className="mt-4 divide-y divide-gray-800 overflow-hidden rounded-2xl border border-gray-800 bg-gray-950">
                  {MENSUAL.map((e) => (
                    <li key={e.que} className="flex items-start justify-between gap-4 px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{e.que}</p>
                        <p className="text-sm text-gray-500">{e.para}</p>
                      </div>
                      <p className="shrink-0 whitespace-nowrap font-bold tabular-nums">{e.precio}</p>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm text-gray-500">La transmisión por YouTube no tiene costo.</p>
              </div>

              {/* Fases */}
              <div>
                <h3 className="text-lg font-extrabold">Se arranca por partes</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {FASES.map((f) => (
                    <div key={f.fase} className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-green-500">{f.fase}</p>
                      <p className="mt-1 font-bold">{f.titulo}</p>
                      <ul className="mt-2 space-y-1 text-sm text-gray-400">
                        {f.puntos.map((p) => (
                          <li key={p} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculadora */}
              <div>
                <h3 className="text-lg font-extrabold">¿En cuánto tiempo se paga?</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Con el logo de un patrocinador en la transmisión y los clips, las cámaras se pagan solas. Cambia los
                  números; los que trae son de ejemplo.
                </p>
                <div className="mt-4 grid gap-5 rounded-2xl border border-gray-800 bg-gray-950 p-5 md:grid-cols-[1.1fr_1fr]">
                  <div className="grid gap-4">
                    <Campo id="tv-canchas" label="Canchas con cámara" value={canchas} onChange={setCanchas} step={1} min={1} />
                    <Campo id="tv-equipo" label="Equipo e instalación por cancha ($)" value={equipo} onChange={setEquipo} step={500} />
                    <Campo id="tv-gasto" label="Gasto mensual por cancha ($)" value={gasto} onChange={setGasto} />
                    <Campo id="tv-patrocinio" label="Patrocinio por cancha al mes ($)" value={patrocinio} onChange={setPatrocinio} />
                    <Campo id="tv-otros" label="Venta de videos por cancha al mes ($)" value={otros} onChange={setOtros} />
                  </div>
                  <div className="flex flex-col gap-3 rounded-2xl bg-gray-900 p-5" aria-live="polite">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-green-500">Recuperas la inversión en</p>
                    <p className={`font-score text-5xl font-bold tabular-nums ${meses ? "" : "text-[var(--mg-live)]"}`}>
                      {meses ? `${meses} ${meses === 1 ? "mes" : "meses"}` : "No se paga"}
                    </p>
                    {[
                      ["Inversión inicial", pesos(inversion)],
                      ["Entra al mes", pesos(entra)],
                      ["Sale al mes", pesos(sale)],
                      ["Ganancia al mes, ya pagado el equipo", pesos(ganancia)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3 border-t border-gray-800 pt-2.5 text-sm">
                        <span className="text-gray-400">{k}</span>
                        <span className="font-bold tabular-nums">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Los precios son aproximados y pueden cambiar según la cancha, la distancia del cableado y el internet
                disponible. Te damos la cotización exacta después de ver tu cancha.
              </p>
            </div>

            {/* Pie */}
            <div className="flex flex-col gap-3 border-t border-gray-800 bg-gray-900 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-400">¿Te interesa? Te armamos la cotización de tu cancha.</p>
              <a
                href={WHATSAPP_TV}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-[15px] font-bold text-white transition hover:bg-green-700"
              >
                Pedir cotización por WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
