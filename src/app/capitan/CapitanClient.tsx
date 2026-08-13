"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Player = {
  id: string;
  name: string;
  number: number | null;
  position: string | null;
  photo: string | null;
};

type Team = {
  id: string;
  name: string;
  logo: string | null;
  players: Player[];
};

export default function CapitanClient({
  team,
  tenantName,
}: {
  team: Team;
  tenantName: string;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [nuevoJugador, setNuevoJugador] = useState({
    name: "",
    number: "",
    position: "",
  });

  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [logo, setLogo] = useState(team.logo || "");

  const fotoRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const logoRef = useRef<HTMLInputElement | null>(null);

  const POSICIONES = [
    "Portero",
    "Defensa",
    "Mediocampista",
    "Delantero",
  ];

  async function agregarJugador() {
    if (!nuevoJugador.name.trim()) return;

    setLoading(true);

    const res = await fetch(
      `/api/admin/torneos/${tenantName}/equipos/${team.id}/jugadores`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nuevoJugador.name.trim(),
          number: nuevoJugador.number
            ? Number(nuevoJugador.number)
            : null,
          position: nuevoJugador.position || null,
        }),
      }
    );

    setLoading(false);

    if (!res.ok) {
      alert("No se pudo agregar el jugador");
      return;
    }

    setNuevoJugador({
      name: "",
      number: "",
      position: "",
    });

    router.refresh();
  }

  async function subirFoto(playerId: string, file: File) {
    const formData = new FormData();
    formData.append("foto", file);

    const res = await fetch(
      `/api/admin/torneos/${tenantName}/equipos/${team.id}/jugadores/${playerId}/foto`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      alert("Error subiendo foto");
      return;
    }

    const data = await res.json();

    setFotos((prev) => ({
      ...prev,
      [playerId]: data.photo,
    }));

    router.refresh();
  }

  async function subirLogo(file: File) {
    const formData = new FormData();
    formData.append("logo", file);

    const res = await fetch(
      `/api/admin/torneos/${tenantName}/equipos/${team.id}/logo`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      alert("Error subiendo logo");
      return;
    }

    const data = await res.json();

    setLogo(data.logo);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-3xl mx-auto">

        <div className="mb-8">
          <p className="text-green-400 text-xs font-bold uppercase tracking-widest">
            Panel del Capitán
          </p>

          <h1 className="text-3xl font-black mt-1">
            {team.name}
          </h1>

          <p className="text-gray-500 mt-1">
            {tenantName}
          </p>
        </div>

        {/* LOGO */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="font-bold mb-4">
            Escudo del equipo
          </h2>

          <div className="flex items-center gap-5">

            <div className="w-24 h-24 rounded-2xl bg-gray-800 border border-gray-700 overflow-hidden flex items-center justify-center">
              {logo ? (
                <img
                  src={logo}
                  alt={team.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl">⚽</span>
              )}
            </div>

            <div>
              <button
                onClick={() => logoRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl font-bold text-sm"
              >
                {logo ? "Cambiar escudo" : "Subir escudo"}
              </button>

              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    subirLogo(file);
                  }

                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </div>

        {/* AGREGAR JUGADOR */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="font-bold mb-4">
            Agregar jugador
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            <input
              type="text"
              placeholder="Nombre"
              value={nuevoJugador.name}
              onChange={(e) =>
                setNuevoJugador({
                  ...nuevoJugador,
                  name: e.target.value,
                })
              }
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3"
            />

            <input
              type="number"
              placeholder="Número"
              value={nuevoJugador.number}
              onChange={(e) =>
                setNuevoJugador({
                  ...nuevoJugador,
                  number: e.target.value,
                })
              }
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3"
            />

            <select
              value={nuevoJugador.position}
              onChange={(e) =>
                setNuevoJugador({
                  ...nuevoJugador,
                  position: e.target.value,
                })
              }
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3"
            >
              <option value="">Posición</option>

              {POSICIONES.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={agregarJugador}
            disabled={loading}
            className="mt-4 bg-green-600 hover:bg-green-500 px-5 py-3 rounded-xl font-bold"
          >
            {loading ? "Agregando..." : "+ Agregar jugador"}
          </button>
        </div>

        {/* JUGADORES */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="font-bold">
              Jugadores ({team.players.length})
            </h2>
          </div>

          {team.players.length === 0 ? (
            <p className="p-6 text-gray-500">
              Todavía no hay jugadores.
            </p>
          ) : (
            <div className="divide-y divide-gray-800">

              {team.players.map((player) => {

                const photo =
                  fotos[player.id] || player.photo;

                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-5"
                  >

                    <div className="flex items-center gap-4">

                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-800 border border-gray-700">

                        {photo ? (
                          <img
                            src={photo}
                            alt={player.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            👤
                          </div>
                        )}

                      </div>

                      <div>
                        <p className="font-bold">
                          {player.name}
                        </p>

                        <p className="text-sm text-gray-500">
                          {player.number !== null
                            ? `#${player.number}`
                            : "Sin número"}{" "}
                          ·{" "}
                          {player.position ||
                            "Sin posición"}
                        </p>
                      </div>

                    </div>

                    <div>

                      <button
                        onClick={() =>
                          fotoRefs.current[player.id]?.click()
                        }
                        className="bg-indigo-900/40 text-indigo-400 px-3 py-2 rounded-lg text-xs font-bold"
                      >
                        📷 {photo ? "Cambiar foto" : "Subir foto"}
                      </button>

                      <input
                        ref={(el) => {
                          fotoRefs.current[player.id] = el;
                        }}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];

                          if (file) {
                            subirFoto(player.id, file);
                          }

                          e.target.value = "";
                        }}
                      />

                    </div>

                  </div>
                );
              })}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}