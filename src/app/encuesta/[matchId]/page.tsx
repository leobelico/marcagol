import { prisma } from "@/lib/prisma";
import EncuestaForm from "./EncuestaForm";

export default async function EncuestaPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { homeTeam: true, awayTeam: true },
  });

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <p>Partido no encontrado.</p>
      </div>
    );
  }

  const fecha = match.date.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Mexico_City",
  });

  return (
    <EncuestaForm
      matchId={match.id}
      fecha={fecha}
      equipos={[
        { id: match.homeTeam.id, name: match.homeTeam.name },
        { id: match.awayTeam.id, name: match.awayTeam.name },
      ]}
    />
  );
}