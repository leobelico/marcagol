"use client";

import Link from "next/link";
import LogoUploader from "./torneos/[id]/LogoUploader";

export default function TorneoCard({ t, isSuperAdmin, appDomain }: {
  t: { id: string; name: string; slug: string; logo?: string | null; _count: { teams: number; matches: number } };
  isSuperAdmin: boolean;
  appDomain: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl p-6 transition group relative">
      <Link href={`/admin/torneos/${t.id}`} className="absolute inset-0 z-0" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-green-900/40 rounded-xl flex items-center justify-center overflow-hidden">
            {t.logo
              ? <img src={t.logo} className="w-full h-full object-cover rounded-xl" />
              : <span className="text-2xl">⚽</span>
            }
          </div>
          <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded-full font-bold">
            Activo
          </span>
        </div>

        <h3 className="text-white font-bold text-lg group-hover:text-green-400 transition">{t.name}</h3>
        <p className="text-gray-500 text-sm mb-4">{t.slug}.{appDomain}</p>

        <div className="flex gap-4 text-sm mb-4">
          <span className="text-gray-400"><span className="text-white font-bold">{t._count.teams}</span> equipos</span>
          <span className="text-gray-400"><span className="text-white font-bold">{t._count.matches}</span> partidos</span>
        </div>

        {isSuperAdmin && (
          <LogoUploader torneoId={t.id} logoActual={t.logo} />
        )}
      </div>
    </div>
  );
}