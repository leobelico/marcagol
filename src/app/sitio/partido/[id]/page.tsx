// Página pública de un partido en el sitio de la liga: marcador, video
// (MarcaGol TV) y jugadas con su clip si lo tienen.
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { embedYoutube } from "@/lib/video";

const TIPO: Record<string, { icono: string; texto: string }> = {
  GOAL: { icono: "⚽", texto: "Gol" },
  YELLOW_CARD: { icono: "🟨", texto: "Amarilla" },
  RED_CARD: { icono: "🟥", texto: "Roja" },
  SUBSTITUTION: { icono: "🅰️", texto: "Asistencia" },
  ASSIST: { icono: "🅰️", texto: "Asistencia" },
};

export default async function PartidoPage({ params }: { params: Promise<{ id: string }> }) {
  const tenant = await getTenant();
  if (!tenant) notFound();
  const { id } = await params;

  const m = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: true,
      awayTeam: true,
      round: true,
      events: {
        orderBy: { minute: "asc" },
        include: { player: { include: { player: true } } },
      },
    },
  });
  if (!m || m.tenantId !== tenant.id) notFound();

  const embed = embedYoutube(m.videoUrl);
  const fecha = new Date(m.date).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Mexico_City",
  });
  const hora = new Date(m.date).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Mexico_City",
  });
  const jugado = m.status === "FINISHED" || m.status === "LIVE";

  return (
    <div className="space-y-6">
      <Link href="/calendario" className="text-sm text-gray-400 transition hover:text-white">
        ← Calendario
      </Link>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <p className="mb-3 text-center text-xs capitalize text-gray-500">
          {m.round ? `${m.round.name ?? `Jornada ${m.round.number}`} · ` : ""}
          {fecha} — {hora}
          {m.cancha ? ` · Cancha ${m.cancha}` : ""}
        </p>
        <div className="flex items-center justify-between gap-4">
          <span className="flex-1 text-right text-lg font-bold">{m.homeTeam.name}</span>
          <div className="min-w-[96px] text-center">
            {jugado ? (
              <span className="font-score text-4xl font-bold tabular-nums">
                {m.homeScore ?? 0} - {m.awayScore ?? 0}
              </span>
            ) : (
              <span className="text-gray-500">vs</span>
            )}
            {m.status === "LIVE" && (
              <p className="mt-1 text-xs font-bold uppercase text-[var(--mg-live)]">En vivo</p>
            )}
          </div>
          <span className="flex-1 text-lg font-bold">{m.awayTeam.name}</span>
        </div>
      </div>

      {embed ? (
        <div className="overflow-hidden rounded-2xl border border-gray-800 bg-black">
          <div className="relative aspect-video w-full">
            <iframe
              src={embed}
              title={`Video: ${m.homeTeam.name} vs ${m.awayTeam.name}`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      ) : m.videoUrl ? (
        <a
          href={m.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl border border-gray-800 bg-gray-900 py-6 font-bold text-green-400 transition hover:bg-gray-800"
        >
          ▶ Ver video del partido
        </a>
      ) : null}

      <div className="rounded-2xl border border-gray-800 bg-gray-900">
        <h2 className="border-b border-gray-800 px-6 py-4 font-bold">Jugadas</h2>
        {m.events.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-500">Sin jugadas registradas</p>
        ) : (
          <ul className="divide-y divide-gray-800">
            {m.events.map((e) => {
              const t = TIPO[e.type] ?? { icono: "•", texto: e.type };
              const local = e.player.player.teamId === m.homeTeamId;
              return (
                <li key={e.id} className="flex items-center gap-3 px-6 py-3 text-sm">
                  <span className="w-9 font-score font-bold tabular-nums text-gray-500">{e.minute}&apos;</span>
                  <span aria-hidden>{t.icono}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{e.player.player.name}</span>{" "}
                    <span className="text-gray-500">
                      {t.texto} · {local ? m.homeTeam.name : m.awayTeam.name}
                    </span>
                  </span>
                  {e.clipUrl && (
                    <a
                      href={e.clipUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-400 transition hover:bg-green-500/25"
                    >
                      ▶ Ver clip
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
