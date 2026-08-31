"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Player = {
  id: string;
  name: string;
  number: number | null;
  position: string | null;
  photo: string | null;
  ineUrl?: string | null;
  documentoOficialUrl?: string | null;
};

type Team = {
  id: string;
  name: string;
  logo: string | null;
  players: Player[];
};

type Props = {
  team: Team;
  tenant: {
    id: string;
    name: string;
  };
  email: string | null;
};

const POSICIONES = ["Portero", "Defensa", "Mediocampista", "Delantero"];

export default function CapitanClient({
  team: initialTeam,
  tenant,
  email,
}: Props) {
  const router = useRouter();

  const [team, setTeam] = useState(initialTeam);
  const [loading, setLoading] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState<string | null>(null);
  const [subiendoLogo, setSubiendoLogo] = useState(false);

  const [mostrarNuevoJugador, setMostrarNuevoJugador] = useState(false);

  const [nuevoJugador, setNuevoJugador] = useState({
    name: "",
    number: "",
    position: "",
  });

  const logoInputRef = useRef<HTMLInputElement | null>(null);

  // =========================
  // DOCUMENTOS (INE / DOC. OFICIAL)
  // =========================

  const [documentos, setDocumentos] = useState<
    Record<string, { ineUrl?: string; documentoOficialUrl?: string }>
  >({});

  const [subiendoDocumento, setSubiendoDocumento] = useState<string | null>(
    null
  ); // `${playerId}-${tipo}`

  const ineInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const documentoOficialInputRefs = useRef<
    Record<string, HTMLInputElement | null>
  >({});

  const fotoInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    setTeam(initialTeam);
  }, [initialTeam]);

  // ─────────────────────────────────────
  // AGREGAR JUGADOR
  // ─────────────────────────────────────

  async function agregarJugador() {
    if (!nuevoJugador.name.trim()) {
      alert("Escribe el nombre del jugador");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `/api/admin/torneos/${tenant.id}/equipos/${team.id}/jugadores`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: nuevoJugador.name.trim(),
            number: nuevoJugador.number ? Number(nuevoJugador.number) : null,
            position: nuevoJugador.position || null,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo crear el jugador");
      }

      setNuevoJugador({
        name: "",
        number: "",
        position: "",
      });

      setMostrarNuevoJugador(false);

      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Error creando jugador");
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────
  // SUBIR FOTO JUGADOR
  // ─────────────────────────────────────

  async function subirFoto(playerId: string, file: File) {
    setSubiendoFoto(playerId);

    try {
      const formData = new FormData();
      formData.append("foto", file);

      const res = await fetch(
        `/api/admin/torneos/${tenant.id}/equipos/${team.id}/jugadores/${playerId}/foto`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo subir la foto");
      }

      // Actualizar inmediatamente la foto en pantalla
      setTeam((prev) => ({
        ...prev,
        players: prev.players.map((player) =>
          player.id === playerId
            ? {
                ...player,
                photo: data.photo,
              }
            : player
        ),
      }));

      router.refresh();
    } catch (error) {
      console.error(error);

      alert(error instanceof Error ? error.message : "Error subiendo foto");
    } finally {
      setSubiendoFoto(null);
    }
  }

  // ─────────────────────────────────────
  // SUBIR LOGO EQUIPO
  // ─────────────────────────────────────

  async function subirLogo(file: File) {
    setSubiendoLogo(true);

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch(
        `/api/admin/torneos/${tenant.id}/equipos/${team.id}/logo`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo subir el logo");
      }

      setTeam((prev) => ({
        ...prev,
        logo: data.logo,
      }));

      router.refresh();
    } catch (error) {
      console.error(error);

      alert(error instanceof Error ? error.message : "Error subiendo logo");
    } finally {
      setSubiendoLogo(false);
    }
  }

  // ============================================================
  // SUBIR DOCUMENTO (INE / DOCUMENTO OFICIAL)
  // ============================================================

  function handleIneClick(playerId: string) {
    ineInputRefs.current[playerId]?.click();
  }

  function handleDocumentoOficialClick(playerId: string) {
    documentoOficialInputRefs.current[playerId]?.click();
  }

  async function handleDocumentoChange(
    playerId: string,
    teamId: string,
    tipo: "ine" | "documentoOficial",
    file: File
  ) {
    const key = `${playerId}-${tipo}`;

    try {
      setSubiendoDocumento(key);

      const formData = new FormData();
      formData.append("documento", file);
      formData.append("tipo", tipo);

      const res = await fetch(
        `/api/admin/torneos/${tenant.id}/equipos/${teamId}/jugadores/${playerId}/documento`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error("Error subiendo documento");
      }

      const data = await res.json();

      setDocumentos((prev) => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          [tipo === "ine" ? "ineUrl" : "documentoOficialUrl"]: data.url,
        },
      }));

      router.refresh();
    } catch (error) {
      console.error(error);
      alert(
        tipo === "ine"
          ? "Error al subir el INE"
          : "Error al subir el documento oficial"
      );
    } finally {
      setSubiendoDocumento(null);
    }
  }

  // ─────────────────────────────────────
  // ELIMINAR JUGADOR
  // ─────────────────────────────────────

  async function eliminarJugador(playerId: string) {
    if (!confirm("¿Eliminar este jugador?")) return;

    setLoading(true);

    try {
      const res = await fetch(
        `/api/admin/torneos/${tenant.id}/equipos/${team.id}/jugadores/${playerId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo eliminar el jugador");
      }

      setTeam((prev) => ({
        ...prev,
        players: prev.players.filter((player) => player.id !== playerId),
      }));

      router.refresh();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error ? error.message : "Error eliminando jugador"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* HEADER */}

      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
          <div>
            <p className="text-xs text-green-400 font-bold uppercase tracking-widest">
              Panel del Capitán
            </p>

            <h1 className="text-xl sm:text-2xl font-black mt-1 break-words">
              ⚽ {team.name}
            </h1>

            <p className="text-sm text-gray-500 mt-1">{tenant.name}</p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-sm text-gray-400 truncate">{email}</p>

            <a
              href="/api/auth/signout"
              className="inline-block mt-2 text-xs bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg"
            >
              Cerrar sesión
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* INFORMACIÓN EQUIPO */}

        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center items-center sm:items-start text-center sm:text-left gap-5">
            {/* LOGO */}

            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={subiendoLogo}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gray-800 border-2 border-gray-700 hover:border-green-500 transition flex items-center justify-center flex-shrink-0"
            >
              {team.logo ? (
                <img
                  src={team.logo}
                  alt={`Logo ${team.name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <div className="text-3xl">⚽</div>
                  <p className="text-xs text-gray-500 mt-1">Subir logo</p>
                </div>
              )}
            </button>

            <input
              ref={logoInputRef}
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

            <div>
              <h2 className="text-2xl font-black">{team.name}</h2>

              <p className="text-gray-500 text-sm mt-1">
                {team.players.length} jugadores registrados
              </p>

              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={subiendoLogo}
                className="mt-3 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg"
              >
                {subiendoLogo
                  ? "Subiendo..."
                  : team.logo
                  ? "Cambiar logo"
                  : "Subir logo del equipo"}
              </button>
            </div>
          </div>
        </section>

        {/* JUGADORES */}

        <section className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-6 py-5 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div>
              <h2 className="text-xl font-black">Jugadores</h2>

              <p className="text-sm text-gray-500 mt-1">
                Agrega y administra los jugadores de tu equipo.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMostrarNuevoJugador(!mostrarNuevoJugador)}
              className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm w-full sm:w-auto"
            >
              + Jugador
            </button>
          </div>

          {/* NUEVO JUGADOR */}

          {mostrarNuevoJugador && (
            <div className="p-4 sm:p-6 bg-gray-800/40 border-b border-gray-800">
              <h3 className="text-sm font-bold text-gray-300 mb-4">
                Nuevo jugador
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Nombre completo *"
                  value={nuevoJugador.name}
                  onChange={(e) =>
                    setNuevoJugador({
                      ...nuevoJugador,
                      name: e.target.value,
                    })
                  }
                  className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-green-500"
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
                  className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-green-500"
                />

                <select
                  value={nuevoJugador.position}
                  onChange={(e) =>
                    setNuevoJugador({
                      ...nuevoJugador,
                      position: e.target.value,
                    })
                  }
                  className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500"
                >
                  <option value="">Posición</option>

                  {POSICIONES.map((posicion) => (
                    <option key={posicion} value={posicion}>
                      {posicion}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button
                  type="button"
                  onClick={agregarJugador}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-500 disabled:opacity-50 px-5 py-2.5 rounded-xl font-bold text-sm w-full sm:w-auto"
                >
                  {loading ? "Agregando..." : "Agregar jugador"}
                </button>

                <button
                  type="button"
                  onClick={() => setMostrarNuevoJugador(false)}
                  className="bg-gray-700 hover:bg-gray-600 px-5 py-2.5 rounded-xl font-bold text-sm w-full sm:w-auto"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* LISTA */}

          {team.players.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">👥</div>

              <p className="text-gray-400">Todavía no tienes jugadores.</p>

              <p className="text-gray-600 text-sm mt-1">
                Agrega el primer jugador de tu equipo.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {team.players.map((player) => {
                const ineActual =
                  documentos[player.id]?.ineUrl ?? player.ineUrl;

                const documentoOficialActual =
                  documentos[player.id]?.documentoOficialUrl ??
                  player.documentoOficialUrl;

                return (
                  <div
                    key={player.id}
                    className="px-4 sm:px-6 py-4 flex flex-col gap-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        {/* FOTO */}

                        <button
                          type="button"
                          onClick={() =>
                            fotoInputRefs.current[player.id]?.click()
                          }
                          disabled={subiendoFoto === player.id}
                          className="w-14 h-14 rounded-xl overflow-hidden bg-gray-800 border border-gray-700 flex-shrink-0 hover:border-green-500 transition"
                        >
                          {player.photo ? (
                            <img
                              src={player.photo}
                              alt={player.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                              👤
                            </div>
                          )}
                        </button>

                        <input
                          ref={(el) => {
                            fotoInputRefs.current[player.id] = el;
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

                        {/* DATOS */}

                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">
                            {player.name}
                          </p>

                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            {player.number !== null && (
                              <span>#{player.number}</span>
                            )}

                            {player.position && (
                              <span>{player.position}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ACCIONES */}

                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:flex-shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            fotoInputRefs.current[player.id]?.click()
                          }
                          disabled={subiendoFoto === player.id}
                          className="text-xs bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-400 font-bold px-3 py-2 rounded-lg"
                        >
                          {subiendoFoto === player.id
                            ? "Subiendo..."
                            : player.photo
                            ? "📷 Cambiar foto"
                            : "📷 Subir foto"}
                        </button>

                        <button
                          type="button"
                          onClick={() => eliminarJugador(player.id)}
                          disabled={loading}
                          className="text-xs text-red-400 hover:text-red-300 px-2 py-2"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {/* DOCUMENTOS: INE / DOCUMENTO OFICIAL */}

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleIneClick(player.id)}
                        disabled={subiendoDocumento === `${player.id}-ine`}
                        className="text-xs bg-purple-900/30 hover:bg-purple-900/50 text-purple-400 font-bold px-2.5 py-1.5 rounded-lg transition flex items-center justify-center gap-1 disabled:opacity-50 flex-1 sm:flex-none min-w-[calc(50%-4px)] sm:min-w-0"
                      >
                        🪪{" "}
                        {subiendoDocumento === `${player.id}-ine`
                          ? "Subiendo..."
                          : ineActual
                          ? "Cambiar INE"
                          : "Subir INE"}
                      </button>

                      <input
                        ref={(el) => {
                          ineInputRefs.current[player.id] = el;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];

                          if (file) {
                            handleDocumentoChange(
                              player.id,
                              team.id,
                              "ine",
                              file
                            );
                          }

                          e.target.value = "";
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => handleDocumentoOficialClick(player.id)}
                        disabled={
                          subiendoDocumento ===
                          `${player.id}-documentoOficial`
                        }
                        className="text-xs bg-teal-900/30 hover:bg-teal-900/50 text-teal-400 font-bold px-2.5 py-1.5 rounded-lg transition flex items-center justify-center gap-1 disabled:opacity-50 flex-1 sm:flex-none min-w-[calc(50%-4px)] sm:min-w-0"
                      >
                        📄{" "}
                        {subiendoDocumento ===
                        `${player.id}-documentoOficial`
                          ? "Subiendo..."
                          : documentoOficialActual
                          ? "Cambiar documento"
                          : "Subir documento"}
                      </button>

                      <input
                        ref={(el) => {
                          documentoOficialInputRefs.current[player.id] = el;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];

                          if (file) {
                            handleDocumentoChange(
                              player.id,
                              team.id,
                              "documentoOficial",
                              file
                            );
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
        </section>
      </main>
    </div>
  );
}