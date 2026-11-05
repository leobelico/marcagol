// Cinta de resultados de la portada, estilo transmisión de TV.
// Muestra los últimos partidos jugados (y los que van en vivo) de los
// torneos publicados. Si todavía hay pocos, completa con ejemplos.
import { prisma } from "@/lib/prisma";

interface Item {
  id: string;
  liga: string;
  local: string;
  visita: string;
  gl: number | null;
  gv: number | null;
  vivo: boolean;
}

const EJEMPLOS: Item[] = [
  ["Halcones FC", "Real Cumbres", 3, 1],
  ["Club Topo Chico", "Atl. Linda Vista", 1, 3],
  ["Deportivo Mitras", "Rayos de Apodaca", 2, 2],
  ["Juventud San Nicolás", "Leones del Obispado", 0, 1],
  ["Real Cumbres", "Rayos de Apodaca", 4, 2],
  ["Leones del Obispado", "Halcones FC", 1, 1],
].map(([local, visita, gl, gv], i) => ({
  id: `ej-${i}`,
  liga: "Liga Del Valle", // la misma liga ficticia de las maquetas del hero
  local: local as string,
  visita: visita as string,
  gl: gl as number,
  gv: gv as number,
  vivo: false,
}));

async function cargar(): Promise<Item[]> {
  try {
    const partidos = await prisma.match.findMany({
      where: {
        status: { in: ["FINISHED", "LIVE"] },
        tenant: {
          published: true,
          archived: false,
          // Fuera torneos de prueba: no deben verse en la portada
          NOT: ["prueba", "test", "demo"].map((p) => ({
            name: { contains: p, mode: "insensitive" as const },
          })),
        },
      },
      orderBy: { date: "desc" },
      take: 16,
      select: {
        id: true,
        status: true,
        homeScore: true,
        awayScore: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        tenant: { select: { name: true } },
      },
    });
    const reales: Item[] = partidos
      .map((m) => ({
        id: m.id,
        liga: m.tenant.name,
        local: m.homeTeam.name,
        visita: m.awayTeam.name,
        gl: m.homeScore,
        gv: m.awayScore,
        vivo: m.status === "LIVE",
      }))
      .sort((a, b) => Number(b.vivo) - Number(a.vivo));
    return reales.length >= 4 ? reales : [...reales, ...EJEMPLOS];
  } catch {
    return EJEMPLOS;
  }
}

export default async function CintaResultados() {
  const items = await cargar();
  // Repetir hasta llenar pantallas anchas; luego duplicar para el bucle
  let base = items;
  while (base.length < 10) base = [...base, ...items];
  const pista = [...base, ...base];

  return (
    <div
      className="mg-ticker relative overflow-hidden border-b border-gray-800 bg-gray-900"
      aria-label="Resultados recientes"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-gray-900 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-gray-900 to-transparent" />
      <ul className="mg-ticker-pista flex w-max items-center gap-8 py-2.5 pl-8">
        {pista.map((m, i) => (
          <li
            key={`${m.id}-${i}`}
            aria-hidden={i >= base.length || undefined}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap text-[13px]"
          >
            <span className="max-w-[16ch] truncate font-semibold">{m.local}</span>
            <span
              className={`rounded-md px-1.5 py-0.5 font-score text-[15px] font-bold tabular-nums ${
                m.vivo ? "bg-[var(--mg-live)] text-white" : "bg-gray-800"
              }`}
            >
              {m.gl ?? 0}-{m.gv ?? 0}
            </span>
            <span className="max-w-[16ch] truncate font-semibold">{m.visita}</span>
            {m.vivo ? (
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase text-[var(--mg-live)]">
                <span className="mg-vivo-punto h-1.5 w-1.5 rounded-full bg-current" />
                En vivo
              </span>
            ) : (
              <span className="max-w-[20ch] truncate text-[11px] font-semibold text-gray-500">{m.liga}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
