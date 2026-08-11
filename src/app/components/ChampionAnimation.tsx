"use client";

import { useEffect, useState } from "react";

type Props = {
  tenantId: string;
  teamName: string;
  teamLogo?: string | null;
};

export default function ChampionAnimation({ tenantId, teamName, teamLogo }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const key = `campeon-visto-${tenantId}`;
    const yaVisto = sessionStorage.getItem(key);
    if (yaVisto) return;

    setVisible(true);
    sessionStorage.setItem(key, "1");

    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [tenantId]);

  if (!visible) return null;

  return (
    <div
      onClick={() => setVisible(false)}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 cursor-pointer animate-fadeIn"
    >
      {/* Confeti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="absolute top-[-10%] w-2 h-2 rounded-sm animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              backgroundColor: ["#facc15", "#22c55e", "#3b82f6", "#ef4444", "#ffffff"][i % 5],
              animationDelay: `${Math.random() * 0.6}s`,
              animationDuration: `${2 + Math.random() * 1.5}s`,
            }}
          />
        ))}
      </div>

      {/* Contenido */}
      <div className="relative flex flex-col items-center gap-4 animate-championPop px-6 text-center">
        <p className="text-yellow-400 text-sm font-bold tracking-[0.3em] uppercase">
          🏆 Campeón del Torneo
        </p>

        <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-800 border-4 border-yellow-500 flex items-center justify-center shadow-[0_0_40px_rgba(250,204,21,0.5)]">
          {teamLogo ? (
            <img src={teamLogo} alt={teamName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">⚽</span>
          )}
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]">
          {teamName}
        </h1>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes championPop {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0.7; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-championPop { animation: championPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-confetti { animation-name: confetti; animation-timing-function: linear; animation-fill-mode: forwards; }
      `}</style>
    </div>
  );
}