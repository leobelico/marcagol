"use client";

import { useState } from "react";
import Link from "next/link";
import LogoUploader from "./torneos/[id]/LogoUploader";

type Carpeta = {
  id: string;
  name: string;
  _count: {
    tenants: number;
  };
};

export default function TorneoCard({
  t,
  isSuperAdmin,
  appDomain,
  carpetas,
}: {
  t: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    archived: boolean;

    folder?: {
      id: string;
      name: string;
    } | null;

    _count: {
      teams: number;
      matches: number;
    };
  };

  isSuperAdmin: boolean;
  appDomain: string;
  carpetas: Carpeta[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [moving, setMoving] = useState(false);

  // =========================================================
  // ARCHIVAR / DESARCHIVAR
  // =========================================================

  const handleArchive = async () => {
    const accion = t.archived
      ? "desarchivar"
      : "archivar";

    const confirmed = window.confirm(
      t.archived
        ? `¿Quieres desarchivar el torneo "${t.name}"?`
        : `¿Quieres archivar el torneo "${t.name}"?`
    );

    if (!confirmed) return;

    try {
      setArchiving(true);

      const res = await fetch(
        "/api/admin/torneos",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: t.id,
            archived: !t.archived,
          }),
        }
      );

      const text = await res.text();

      if (!res.ok) {
        throw new Error(
          `Error ${res.status}: ${text}`
        );
      }

      window.location.reload();

    } catch (error) {

      console.error(
        `ERROR ${accion.toUpperCase()}:`,
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : `No se pudo ${accion} el torneo`
      );

      setArchiving(false);
    }
  };

  // =========================================================
  // MOVER A CARPETA
  // =========================================================

  const handleMove = async (
    folderId: string | null
  ) => {

    const destino = folderId
      ? carpetas.find(
          (c) => c.id === folderId
        )?.name
      : "Sin carpeta";

    const confirmed = window.confirm(
      `¿Quieres mover "${t.name}" a "${destino}"?`
    );

    if (!confirmed) return;

    try {

      setMoving(true);

      const res = await fetch(
        "/api/admin/torneos/mover",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            tenantId: t.id,
            folderId,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "No se pudo mover el torneo"
        );
      }

      window.location.reload();

    } catch (error) {

      console.error(
        "ERROR MOVIENDO TORNEO:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "No se pudo mover el torneo"
      );

      setMoving(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      className={`relative bg-gray-900 border rounded-2xl p-6 transition group ${
        t.archived
          ? "border-yellow-900/60 hover:border-yellow-700"
          : "border-gray-800 hover:border-gray-600"
      }`}
    >

      {/* =====================================================
          CARD
      ===================================================== */}

      <Link
        href={`/admin/torneos/${t.id}`}
        className="block"
      >

        <div>

          {/* LOGO + ESTADO */}

          <div className="flex items-start justify-between mb-4">

            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden ${
                t.archived
                  ? "bg-yellow-900/30"
                  : "bg-green-900/40"
              }`}
            >

              {t.logo ? (

                <img
                  src={t.logo}
                  className="w-full h-full object-cover rounded-xl"
                  alt=""
                />

              ) : (

                <span className="text-2xl">
                  ⚽
                </span>

              )}

            </div>

            <span
              className={`text-xs px-2 py-1 rounded-full font-bold ${
                t.archived
                  ? "bg-yellow-900/30 text-yellow-400"
                  : "bg-green-900/30 text-green-400"
              }`}
            >
              {t.archived
                ? "Archivado"
                : "Activo"}
            </span>

          </div>

          {/* NOMBRE */}

          <h3
            className={`font-bold text-lg transition ${
              t.archived
                ? "text-gray-300 group-hover:text-yellow-400"
                : "text-white group-hover:text-green-400"
            }`}
          >
            {t.name}
          </h3>

          {/* DOMINIO */}

          <p className="text-gray-500 text-sm mb-4">
            {t.slug}.{appDomain}
          </p>

          {/* CARPETA */}

          {t.folder && (
            <p className="text-xs text-purple-400 mb-3">
              📁 {t.folder.name}
            </p>
          )}

          {/* ESTADISTICAS */}

          <div className="flex gap-4 text-sm mb-4">

            <span className="text-gray-400">

              <span className="text-white font-bold">
                {t._count.teams}
              </span>{" "}
              equipos

            </span>

            <span className="text-gray-400">

              <span className="text-white font-bold">
                {t._count.matches}
              </span>{" "}
              partidos

            </span>

          </div>

        </div>

      </Link>

      {/* =====================================================
          MENÚ DE OPCIONES
      ===================================================== */}

      {isSuperAdmin && (

        <div className="absolute top-5 right-5">

          <button
            type="button"
            onClick={(e) => {

              e.preventDefault();
              e.stopPropagation();

              setMenuOpen(
                (prev) => !prev
              );

            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
            aria-label="Opciones del torneo"
          >
            ⋮
          </button>

          {menuOpen && (

            <div className="absolute right-0 top-10 z-50 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden">

              {/* =================================================
                  LOGO
              ================================================= */}

              <div className="px-4 py-3 border-b border-gray-700">

                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                  Logo del torneo
                </p>

                <LogoUploader
                  torneoId={t.id}
                  logoActual={t.logo}
                />

              </div>

              {/* =================================================
                  MOVER A CARPETA
              ================================================= */}

              <div className="border-b border-gray-700">

                <p className="px-4 pt-3 text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Mover a carpeta
                </p>

                {moving ? (

                  <div className="px-4 py-3 text-sm text-gray-400">
                    Moviendo...
                  </div>

                ) : (

                  <>

                    {/* SIN CARPETA */}

                    <button
                      type="button"
                      onClick={() =>
                        handleMove(null)
                      }
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-700 transition ${
                        !t.folder
                          ? "text-purple-400"
                          : "text-gray-300"
                      }`}
                    >
                      ⚽ Sin carpeta
                    </button>

                    {/* CARPETAS */}

                    {carpetas.map(
                      (carpeta) => (

                        <button
                          key={carpeta.id}
                          type="button"
                          onClick={() =>
                            handleMove(
                              carpeta.id
                            )
                          }
                          className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-700 transition ${
                            t.folder?.id ===
                            carpeta.id
                              ? "text-purple-400"
                              : "text-gray-300"
                          }`}
                        >
                          📁 {carpeta.name}
                        </button>

                      )
                    )}

                  </>

                )}

              </div>

              {/* =================================================
                  ARCHIVAR / DESARCHIVAR
              ================================================= */}

              <button
                type="button"
                onClick={handleArchive}
                disabled={archiving}
                className={`w-full px-4 py-3 text-left text-sm transition disabled:opacity-50 ${
                  t.archived
                    ? "text-green-400 hover:bg-gray-700 hover:text-green-300"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >

                {archiving
                  ? t.archived
                    ? "Desarchivando..."
                    : "Archivando..."
                  : t.archived
                    ? "↩️ Desarchivar torneo"
                    : "📦 Archivar torneo"}

              </button>

            </div>

          )}

        </div>

      )}

    </div>
  );
}