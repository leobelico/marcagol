import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function InfoPage() {
  const tenant = await getTenant();
  if (!tenant) notFound();

  const torneo = await prisma.tenant.findUnique({
    where: { id: tenant.id },
    include: {
      teams: true,
      _count: { select: { teams: true } },
    },
  });

  if (!torneo || !torneo.published) notFound();

  const lugaresDisponibles = torneo.maxTeams
    ? torneo.maxTeams - torneo._count.teams
    : null;

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">

      {/* Banner hero */}
      <div
        className="rounded-2xl overflow-hidden min-h-64 flex flex-col justify-end p-8 relative"
        style={{
          background: torneo.bannerUrl
            ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.85)), url(${torneo.bannerUrl}) center/cover`
            : "linear-gradient(135deg, #064e3b 0%, #111827 100%)",
        }}>
        <p className="text-green-400 text-xs font-bold tracking-widest uppercase mb-2">⚽ Torneo de Fútbol</p>
        <h1 className="text-4xl font-black text-white">{torneo.name}</h1>
        {torneo.description && (
          <p className="text-gray-300 mt-3 text-sm max-w-lg">{torneo.description}</p>
        )}
      </div>

      {/* Info rápida */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {torneo.startDate && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl mb-1">📅</p>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Inicio</p>
            <p className="text-white font-bold text-sm">
              {new Date(torneo.startDate).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        )}
        {torneo.endDate && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl mb-1">🏁</p>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Fin</p>
            <p className="text-white font-bold text-sm">
              {new Date(torneo.endDate).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        )}
        {torneo.maxTeams && (
          <div className={`border rounded-xl p-4 text-center ${lugaresDisponibles === 0 ? "bg-red-950/30 border-red-900/50" : "bg-gray-900 border-gray-800"}`}>
            <p className="text-2xl mb-1">{lugaresDisponibles === 0 ? "🔴" : "🟢"}</p>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Lugares</p>
            <p className={`font-bold text-sm ${lugaresDisponibles === 0 ? "text-red-400" : "text-green-400"}`}>
              {lugaresDisponibles === 0 ? "LLENO" : `${lugaresDisponibles} disponibles`}
            </p>
          </div>
        )}
        {torneo.inscriptionFee != null && (
          <div className="bg-green-950/30 border border-green-900/50 rounded-xl p-4 text-center">
            <p className="text-2xl mb-1">💰</p>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Inscripción</p>
            <p className="text-green-400 font-black text-sm">{formatMoney(torneo.inscriptionFee)}</p>
          </div>
        )}
      </div>

      {/* Equipos inscritos */}
      {torneo.teams.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Equipos Inscritos ({torneo._count.teams}{torneo.maxTeams ? `/${torneo.maxTeams}` : ""})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {torneo.teams.map((t) => (
              <div key={t.id} className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2.5">
                <span className="text-green-400">⚽</span>
                <span className="text-white text-sm font-medium">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contacto */}
      {(torneo.contactName || torneo.contactPhone || torneo.contactEmail) && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Contacto</h2>
          <div className="space-y-3">
            {torneo.contactName && (
              <p className="text-white font-bold text-lg">{torneo.contactName}</p>
            )}
            {torneo.contactPhone && (
              <a href={`tel:${torneo.contactPhone}`}
                className="flex items-center gap-3 text-gray-300 hover:text-white transition text-sm">
                📱 {torneo.contactPhone}
              </a>
            )}
            {torneo.contactEmail && (
              <a href={`mailto:${torneo.contactEmail}`}
                className="flex items-center gap-3 text-gray-300 hover:text-white transition text-sm">
                ✉️ {torneo.contactEmail}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Redes sociales */}
      {(torneo.instagram || torneo.facebook || torneo.whatsapp) && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Redes Sociales</h2>
          <div className="flex flex-wrap gap-3">
            {torneo.instagram && (
              <a href={`https://instagram.com/${torneo.instagram.replace("@", "")}`} target="_blank"
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2.5 rounded-xl transition text-sm font-bold text-white">
                📸 {torneo.instagram}
              </a>
            )}
            {torneo.facebook && (
              <a href={torneo.facebook.startsWith("http") ? torneo.facebook : `https://${torneo.facebook}`} target="_blank"
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2.5 rounded-xl transition text-sm font-bold text-white">
                📘 Facebook
              </a>
            )}
            {torneo.whatsapp && (
              <a href={torneo.whatsapp} target="_blank"
                className="flex items-center gap-2 bg-green-700 hover:bg-green-600 px-4 py-2.5 rounded-xl transition text-sm font-bold text-white">
                💬 WhatsApp
              </a>
            )}
          </div>
        </div>
      )}

      {/* CTA ver torneo */}
      <div className="text-center py-4">
        <Link href="/"
          className="inline-block bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-4 rounded-xl transition text-base">
          Ver tabla de posiciones →
        </Link>
      </div>

    </div>
  );
}