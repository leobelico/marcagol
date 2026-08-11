"use client";

import { useEffect, useState } from "react";

type TopScorer = {
  id: string;
  name: string;
  photo?: string | null;
  goals: number;
};

type Props = {
  tenantId: string;
  teamName: string;
  teamLogo?: string | null;
  topScorers?: TopScorer[];
};

type Stage = "champion" | "scorers";

const CHAMPION_DURATION = 3000; // tiempo mostrando al campeón
const SCORERS_DURATION = 4500; // tiempo mostrando el top de goleadores

export default function ChampionAnimation({ tenantId, teamName, teamLogo, topScorers = [] }: Props) {
  const [visible, setVisible] = useState(false);
  const [stage, setStage] = useState<Stage>("champion");

  const hayGoleadores = topScorers.length > 0;

  useEffect(() => {
    const key = `campeon-visto-${tenantId}`;
    const yaVisto = sessionStorage.getItem(key);
    if (yaVisto) return;

    setVisible(true);
    setStage("champion");
    sessionStorage.setItem(key, "1");

    // Fase 1: campeón
    const t1 = setTimeout(() => {
      if (hayGoleadores) {
        setStage("scorers");
      } else {
        setVisible(false);
      }
    }, CHAMPION_DURATION);

    return () => clearTimeout(t1);
  }, [tenantId, hayGoleadores]);

  // Fase 2: goleadores → se cierra sola después de un tiempo
  useEffect(() => {
    if (!visible || stage !== "scorers") return;
    const t2 = setTimeout(() => setVisible(false), SCORERS_DURATION);
    return () => clearTimeout(t2);
  }, [visible, stage]);

  if (!visible) return null;

  const medalStyles = [
    { border: "border-yellow-500", badge: "bg-yellow-500 text-black", size: "w-24 h-24", order: "order-2" },
    { border: "border-gray-400", badge: "bg-gray-400 text-black", size: "w-20 h-20", order: "order-1" },
    { border: "border-amber-700", badge: "bg-amber-700 text-white", size: "w-20 h-20", order: "order-3" },
  ];

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

      {/* Fase 1: Campeón */}
      {stage === "champion" && (
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
      )}

      {/* Fase 2: Top 3 goleadores */}
      {stage === "scorers" && (
        <div className="relative flex flex-col items-center gap-8 animate-slideIn px-6 text-center">
          <p className="text-yellow-400 text-sm font-bold tracking-[0.3em] uppercase">
            ⚽ Goleo Individual
          </p>

          <div className="flex items-end justify-center gap-6 md:gap-10">
            {topScorers.slice(0, 3).map((s, i) => {
              const style = medalStyles[i];
              return (
                <div
                  key={s.id}
                  className={`flex flex-col items-center gap-2 ${style.order} animate-scorerPop`}
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <span className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full ${style.badge}`}>
                    {i + 1}
                  </span>
                  <div className={`${style.size} rounded-full overflow-hidden bg-gray-800 border-4 ${style.border} flex items-center justify-center shadow-[0_0_25px_rgba(0,0,0,0.4)]`}>
                    {s.photo ? (
                      <img src={s.photo} alt={s.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>
                  <p className="text-white font-bold text-sm max-w-[110px] truncate">{s.name}</p>
                  <p className="text-green-400 font-black text-2xl leading-none">
                    {s.goals} <span className="text-xs font-bold text-gray-400 uppercase">{s.goals === 1 ? "gol" : "goles"}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
        @keyframes slideIn {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes scorerPop {
          0% { transform: translateY(20px) scale(0.85); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0.7; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-championPop { animation: championPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-slideIn { animation: slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-scorerPop { animation: scorerPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .animate-confetti { animation-name: confetti; animation-timing-function: linear; animation-fill-mode: forwards; }
      `}</style>
    </div>
  );
}