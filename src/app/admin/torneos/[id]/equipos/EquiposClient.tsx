"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Player = {
  id: string;
  name: string;
  number: number | null;
  position: string | null;
  photo?: string | null;
};

type Team = {
  id: string;
  name: string;
  captain: string | null;
  phone: string | null;
  logo?: string | null;
  players: Player[];
  _count: {
    players: number;
  };
};

type Torneo = {
  id: string;
  name: string;
  teams: Team[];
  logo?: string | null;
};

type EquipoBusqueda = {
  id: string;
  name: string;
  logo: string | null;
  captain: string | null;
  phone: string | null;
  tenant: {
    name: string;
  };
  _count: {
    players: number;
  };
};

const fotosEnMemoria: Record<string, string> = {};

export default function EquiposClient({
  torneo,
}: {
  torneo: Torneo;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState<string | null>(null);

  // =========================
  // EDITAR EQUIPO
  // =========================

  const [editandoEquipo, setEditandoEquipo] = useState<string | null>(null);

  const [equipoEdit, setEquipoEdit] = useState({
    name: "",
    captain: "",
    phone: "",
  });

  // =========================
  // EDITAR JUGADOR
  // =========================

  const [editandoJugador, setEditandoJugador] =
    useState<string | null>(null);

  const [jugadorEdit, setJugadorEdit] = useState({
    name: "",
    number: "",
    position: "",
  });

  // =========================
  // NUEVO EQUIPO
  // =========================

  const [showNuevoEquipo, setShowNuevoEquipo] =
    useState(false);

  const [nuevoEquipo, setNuevoEquipo] = useState({
    name: "",
    captain: "",
    phone: "",
  });

  // =========================
  // NUEVO JUGADOR
  // =========================

  const [equipoSeleccionado, setEquipoSeleccionado] =
    useState<string | null>(null);

  const [nuevoJugador, setNuevoJugador] = useState({
    name: "",
    number: "",
    position: "",
  });

  // =========================
  // TRAER EQUIPO (IMPORTAR)
  // =========================

  const [showTraerEquipo, setShowTraerEquipo] =
    useState(false);

  const [busquedaEquipo, setBusquedaEquipo] =
    useState("");

  const [resultadosBusqueda, setResultadosBusqueda] =
    useState<EquipoBusqueda[]>([]);

  const [buscandoEquipo, setBuscandoEquipo] =
    useState(false);

  const [importandoId, setImportandoId] =
    useState<string | null>(null);

  // =========================
  // FOTOS
  // =========================

  const [fotos, setFotos] =
    useState<Record<string, string>>(fotosEnMemoria);

  const fileInputRefs =
    useRef<Record<string, HTMLInputElement | null>>({});

  // =========================
  // LOGOS
  // =========================

  const [logos, setLogos] =
    useState<Record<string, string>>({});

  const logoInputRefs =
    useRef<Record<string, HTMLInputElement | null>>({});

  // =========================
  // POSICIONES
  // =========================

  const POSICIONES = [
    "Portero",
    "Defensa",
    "Mediocampista",
    "Delantero",
  ];

  // ============================================================
  // FOTO JUGADOR
  // ============================================================

  function handleFotoClick(playerId: string) {
    fileInputRefs.current[playerId]?.click();
  }

  async function handleFotoChange(
    playerId: string,
    teamId: string,
    file: File
  ) {
    try {
      // Preview inmediato
      const reader = new FileReader();

      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;

        setFotos((prev) => ({
          ...prev,
          [playerId]: dataUrl,
        }));

        // Subir archivo
        const formData = new FormData();
        formData.append("foto", file);

        const res = await fetch(
          `/api/admin/torneos/${torneo.id}/equipos/${teamId}/jugadores/${playerId}/foto`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!res.ok) {
          throw new Error("Error subiendo imagen");
        }

        const data = await res.json();

        // Guardar URL definitiva
        setFotos((prev) => ({
          ...prev,
          [playerId]: data.photo,
        }));

        router.refresh();
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      alert("Error al subir la foto");
    }
  }

  // ============================================================
  // LOGO EQUIPO
  // ============================================================

  function handleLogoClick(teamId: string) {
    logoInputRefs.current[teamId]?.click();
  }

  async function handleLogoChange(
    teamId: string,
    file: File
  ) {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch(
        `/api/admin/torneos/${torneo.id}/equipos/${teamId}/logo`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error("Error subiendo logo");
      }

      const data = await res.json();

      setLogos((prev) => ({
        ...prev,
        [teamId]: data.logo,
      }));

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error subiendo logo");
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // GENERAR CREDENCIALES PDF
  // ============================================================

  async function generarCredenciales(team: Team) {
    try {
      setGenerandoPDF(team.id);

      const { jsPDF } = await import("jspdf");

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // -------------------------
      // Cargar logo del torneo
      // -------------------------

      let logoData: string | null = null;
      let logoFormato: "JPEG" | "PNG" = "JPEG";

      if (torneo.logo) {
        try {
          const response = await fetch(torneo.logo);

          if (response.ok) {
            const blob = await response.blob();

            logoFormato =
              blob.type === "image/png"
                ? "PNG"
                : "JPEG";

            logoData = await new Promise<string>(
              (resolve) => {
                const reader = new FileReader();

                reader.onloadend = () => {
                  resolve(reader.result as string);
                };

                reader.readAsDataURL(blob);
              }
            );
          }
        } catch (error) {
          console.error(
            "Error cargando logo:",
            error
          );
        }
      }

      // -------------------------
      // Configuración página
      // -------------------------

      const pageWidth =
        doc.internal.pageSize.getWidth();

      const pageHeight =
        doc.internal.pageSize.getHeight();

      const cardW = 85.6;
      const cardH = 54;

      const marginX = 10;
      const marginY = 15;

      const cols = 2;

      const gapX =
        (pageWidth -
          marginX * 2 -
          cardW * cols) /
        (cols - 1);

      const gapY = 8;

      const players = team.players;

      let col = 0;
      let row = 0;

      // -------------------------
      // Crear tarjetas
      // -------------------------

      for (let i = 0; i < players.length; i++) {
        const player = players[i];

        const x =
          marginX +
          col * (cardW + gapX);

        const y =
          marginY +
          row * (cardH + gapY);

        // Fondo
        doc.setFillColor(
          255,
          255,
          255
        );

        doc.roundedRect(
          x,
          y,
          cardW,
          cardH,
          3,
          3,
          "F"
        );

        // Borde
        doc.setDrawColor(
          220,
          220,
          220
        );

        doc.setLineWidth(0.3);

        doc.roundedRect(
          x,
          y,
          cardW,
          cardH,
          3,
          3,
          "S"
        );

        // -------------------------
        // Barra superior
        // -------------------------

        doc.setFillColor(
          22,
          163,
          74
        );

        doc.rect(
          x,
          y,
          cardW,
          8,
          "F"
        );

        // Logo
        if (logoData) {
          try {
            doc.addImage(
              logoData,
              logoFormato,
              x + cardW - 20,
              y + 0.5,
              19,
              7
            );
          } catch (error) {
            console.error(
              "Error agregando logo:",
              error
            );
          }
        }

        // Nombre torneo
        doc.setTextColor(
          255,
          255,
          255
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(6.5);

        doc.text(
          torneo.name.toUpperCase(),
          x + 3,
          y + 5.2
        );

        // -------------------------
        // Foto jugador
        // -------------------------

        const fotoSize = 22;

        const fotoX = x + 5;
        const fotoY = y + 11;

        const fotoData =
          fotos[player.id] ||
          player.photo;

        if (fotoData) {
          try {
            const fmt =
              fotoData.startsWith(
                "data:image/png"
              )
                ? "PNG"
                : "JPEG";

            doc.addImage(
              fotoData,
              fmt,
              fotoX,
              fotoY,
              fotoSize,
              fotoSize
            );

            doc.setDrawColor(
              22,
              163,
              74
            );

            doc.setLineWidth(0.5);

            doc.rect(
              fotoX,
              fotoY,
              fotoSize,
              fotoSize
            );
          } catch {
            doc.setFillColor(
              240,
              240,
              240
            );

            doc.rect(
              fotoX,
              fotoY,
              fotoSize,
              fotoSize,
              "F"
            );
          }
        } else {
          doc.setFillColor(
            240,
            240,
            240
          );

          doc.roundedRect(
            fotoX,
            fotoY,
            fotoSize,
            fotoSize,
            2,
            2,
            "F"
          );

          doc.setTextColor(
            150,
            150,
            150
          );

          doc.setFontSize(7);

          doc.text(
            "SIN FOTO",
            fotoX + fotoSize / 2,
            fotoY + fotoSize / 2,
            {
              align: "center",
            }
          );
        }

        // -------------------------
        // Datos jugador
        // -------------------------

        const dataX =
          fotoX + fotoSize + 4;

        const dataW =
          cardW - fotoSize - 14;

        if (player.number !== null) {
          doc.setTextColor(
            22,
            163,
            74
          );

          doc.setFont(
            "helvetica",
            "bold"
          );

          doc.setFontSize(22);

          doc.text(
            `#${player.number}`,
            dataX,
            fotoY + 10
          );
        }

        doc.setTextColor(
          15,
          23,
          42
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(9);

        const nombreLines =
          doc.splitTextToSize(
            player.name.toUpperCase(),
            dataW
          );

        doc.text(
          nombreLines.slice(0, 2),
          dataX,
          fotoY +
            (player.number !== null
              ? 17
              : 8)
        );

        if (player.position) {
          doc.setTextColor(
            22,
            163,
            74
          );

          doc.setFont(
            "helvetica",
            "normal"
          );

          doc.setFontSize(7);

          doc.text(
            player.position.toUpperCase(),
            dataX,
            fotoY +
              (player.number !== null
                ? 24
                : 16)
          );
        }

        // -------------------------
        // Pie equipo
        // -------------------------

        doc.setFillColor(
          240,
          240,
          240
        );

        doc.rect(
          x,
          y + cardH - 9,
          cardW,
          9,
          "F"
        );

        doc.setTextColor(
          75,
          85,
          99
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(6.5);

        doc.text(
          team.name.toUpperCase(),
          x + cardW / 2,
          y + cardH - 3.5,
          {
            align: "center",
          }
        );

        // -------------------------
        // Siguiente tarjeta
        // -------------------------

        col++;

        if (col >= cols) {
          col = 0;
          row++;

          const maxRows = Math.floor(
            (pageHeight -
              marginY * 2) /
              (cardH + gapY)
          );

          if (
            row >= maxRows &&
            i < players.length - 1
          ) {
            doc.addPage();
            row = 0;
          }
        }
      }

      // -------------------------
      // Sin jugadores
      // -------------------------

      if (players.length === 0) {
        doc.setTextColor(
          150,
          150,
          150
        );

        doc.setFontSize(12);

        doc.text(
          "Sin jugadores registrados.",
          pageWidth / 2,
          pageHeight / 2,
          {
            align: "center",
          }
        );
      }

      // Descargar
      doc.save(
        `Credenciales_${team.name.replace(
          /\s+/g,
          "_"
        )}.pdf`
      );
    } catch (error) {
      console.error(error);
      alert(
        "No se pudieron generar las credenciales."
      );
    } finally {
      setGenerandoPDF(null);
    }
  }

  // ============================================================
  // GUARDAR EQUIPO
  // ============================================================

  async function guardarEquipo(teamId: string) {
  if (!equipoEdit.name.trim()) {
    alert("El nombre del equipo es obligatorio");
    return;
  }

  if (!equipoEdit.captain.trim()) {
    alert("El nombre del capitán es obligatorio");
    return;
  }

  if (!equipoEdit.phone.trim()) {
    alert("El teléfono del capitán es obligatorio");
    return;
  }

  try {
    setLoading(true);

    const res = await fetch(
      `/api/admin/torneos/${torneo.id}/equipos/${teamId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: equipoEdit.name.trim(),
          captain: equipoEdit.captain.trim(),
          phone: equipoEdit.phone.trim(),
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data?.error ||
          "No se pudo actualizar el equipo"
      );
    }

    setEditandoEquipo(null);

    router.refresh();
  } catch (error: any) {
    console.error("ERROR ACTUALIZANDO EQUIPO:", error);

    alert(
      error?.message ||
        "No se pudo actualizar el equipo"
    );
  } finally {
    setLoading(false);
  }
}

  // ============================================================
  // GUARDAR JUGADOR
  // ============================================================

  async function guardarJugador(
    teamId: string,
    playerId: string
  ) {
    if (!jugadorEdit.name.trim()) {
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/torneos/${torneo.id}/equipos/${teamId}/jugadores/${playerId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: jugadorEdit.name.trim(),
            number: jugadorEdit.number
              ? Number(
                  jugadorEdit.number
                )
              : null,
            position:
              jugadorEdit.position ||
              null,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(
          "No se pudo actualizar el jugador"
        );
      }

      setEditandoJugador(null);

      router.refresh();
    } catch (error) {
      console.error(error);

      alert(
        "No se pudo actualizar el jugador"
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // CREAR EQUIPO
  // ============================================================

async function crearEquipo() {
  if (!nuevoEquipo.name.trim()) {
    alert("El nombre del equipo es obligatorio");
    return;
  }

  if (!nuevoEquipo.captain.trim()) {
    alert("El nombre del capitán es obligatorio");
    return;
  }

  if (!nuevoEquipo.phone.trim()) {
    alert("El teléfono del capitán es obligatorio");
    return;
  }

  try {
    setLoading(true);

    const res = await fetch(
      `/api/admin/torneos/${torneo.id}/equipos`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nuevoEquipo.name.trim(),
          captain: nuevoEquipo.captain.trim(),
          phone: nuevoEquipo.phone.trim(),
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data?.error ||
        "No se pudo crear el equipo"
      );
    }

    console.log(
      "EQUIPO CREADO:",
      data.team
    );

    console.log(
      "USUARIO CREADO:",
      data.user
    );

    console.log(
      "RELACIÓN CREADA:",
      data.tenantUser
    );

    // Mostrar credenciales al administrador
    if (data.captainCredentials) {
      alert(
        `Equipo creado correctamente.\n\n` +
        `CAPITÁN: ${data.captainCredentials.name}\n` +
        `EMAIL: ${data.captainCredentials.email}\n` +
        `TELÉFONO: ${data.captainCredentials.phone}\n` +
        `CONTRASEÑA: ${data.captainCredentials.password}`
      );
    }

    setNuevoEquipo({
      name: "",
      captain: "",
      phone: "",
    });

    setShowNuevoEquipo(false);

    router.refresh();

  } catch (error: any) {

    console.error(
      "ERROR CREANDO EQUIPO:",
      error
    );

    alert(
      error?.message ||
      "Error al crear el equipo"
    );

  } finally {
    setLoading(false);
  }
}
  // ============================================================
  // ELIMINAR EQUIPO
  // ============================================================

  async function eliminarEquipo(
    teamId: string
  ) {
    if (
      !confirm(
        "¿Eliminar este equipo y todos sus jugadores?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/torneos/${torneo.id}/equipos/${teamId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        throw new Error(
          "No se pudo eliminar el equipo"
        );
      }

      router.refresh();
    } catch (error) {
      console.error(error);

      alert(
        "No se pudo eliminar el equipo"
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // AGREGAR JUGADOR
  // ============================================================

  async function agregarJugador(
    teamId: string
  ) {
    if (!nuevoJugador.name.trim()) {
      alert(
        "El nombre del jugador es obligatorio"
      );
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/torneos/${torneo.id}/equipos/${teamId}/jugadores`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: nuevoJugador.name.trim(),
            number: nuevoJugador.number
              ? Number(
                  nuevoJugador.number
                )
              : null,
            position:
              nuevoJugador.position ||
              null,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(
          "No se pudo agregar el jugador"
        );
      }

      setNuevoJugador({
        name: "",
        number: "",
        position: "",
      });

      setEquipoSeleccionado(null);

      router.refresh();
    } catch (error) {
      console.error(error);

      alert(
        "No se pudo agregar el jugador"
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // ELIMINAR JUGADOR
  // ============================================================

  async function eliminarJugador(
    teamId: string,
    playerId: string
  ) {
    if (
      !confirm(
        "¿Eliminar este jugador?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/torneos/${torneo.id}/equipos/${teamId}/jugadores/${playerId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        throw new Error(
          "No se pudo eliminar el jugador"
        );
      }

      router.refresh();
    } catch (error) {
      console.error(error);

      alert(
        "No se pudo eliminar el jugador"
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // BUSCAR EQUIPO EN OTROS TORNEOS
  // ============================================================

  async function buscarEquipos(query: string) {
    setBusquedaEquipo(query);

    if (!query.trim()) {
      setResultadosBusqueda([]);
      return;
    }

    try {
      setBuscandoEquipo(true);

      const res = await fetch(
        `/api/admin/torneos/${torneo.id}/equipos/importar?q=${encodeURIComponent(
          query.trim()
        )}`
      );

      if (!res.ok) {
        throw new Error("No se pudo buscar equipos");
      }

      const data = await res.json();

      setResultadosBusqueda(data.teams || []);
    } catch (error) {
      console.error(error);
      setResultadosBusqueda([]);
    } finally {
      setBuscandoEquipo(false);
    }
  }

  // ============================================================
  // IMPORTAR EQUIPO
  // ============================================================

  async function importarEquipo(sourceTeamId: string) {
    try {
      setImportandoId(sourceTeamId);

      const res = await fetch(
        `/api/admin/torneos/${torneo.id}/equipos/importar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceTeamId,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "No se pudo importar el equipo"
        );
      }

      setShowTraerEquipo(false);
      setBusquedaEquipo("");
      setResultadosBusqueda([]);

      router.refresh();
    } catch (error: any) {
      console.error("ERROR IMPORTANDO EQUIPO:", error);

      alert(
        error?.message || "No se pudo importar el equipo"
      );
    } finally {
      setImportandoId(null);
    }
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">
            Equipos
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            {torneo.teams.length} equipos registrados
          </p>
        </div>

        <div className="flex gap-2">

          <button
            onClick={() =>
              setShowTraerEquipo(true)
            }
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm"
          >
            📥 Traer Equipo
          </button>

          <button
            onClick={() =>
              setShowNuevoEquipo(true)
            }
            className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm"
          >
            + Agregar Equipo
          </button>

        </div>
      </div>

      {/* ======================================================
          TRAER EQUIPO (IMPORTAR DE OTRO TORNEO)
      ====================================================== */}

      {showTraerEquipo && (
        <div className="bg-gray-900 border border-blue-800 rounded-2xl p-5">

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">
              Traer Equipo de Otro Torneo
            </h3>

            <button
              onClick={() => {
                setShowTraerEquipo(false);
                setBusquedaEquipo("");
                setResultadosBusqueda([]);
              }}
              className="text-gray-500 hover:text-gray-300 text-sm"
            >
              ✕
            </button>
          </div>

          <input
            type="text"
            autoFocus
            placeholder="Buscar equipo por nombre..."
            value={busquedaEquipo}
            onChange={(e) =>
              buscarEquipos(e.target.value)
            }
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition text-sm mb-3"
          />

          {buscandoEquipo && (
            <p className="text-gray-500 text-xs">
              Buscando...
            </p>
          )}

          {!buscandoEquipo &&
            busquedaEquipo.trim() &&
            resultadosBusqueda.length === 0 && (
              <p className="text-gray-500 text-xs">
                No se encontraron equipos con ese nombre.
              </p>
            )}

          <div className="space-y-2">

            {resultadosBusqueda.map((equipo) => (

              <div
                key={equipo.id}
                className="flex items-center justify-between gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3"
              >

                <div className="flex items-center gap-3 min-w-0">

                  <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-900 border border-gray-700 flex items-center justify-center flex-shrink-0">
                    {equipo.logo ? (
                      <img
                        src={equipo.logo}
                        alt={equipo.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm text-gray-500">
                        ⚽
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {equipo.name}
                    </p>

                    <p className="text-gray-500 text-xs truncate">
                      {equipo.tenant.name} ·{" "}
                      {equipo._count.players} jugadores
                      {equipo.captain
                        ? ` · 👤 ${equipo.captain}`
                        : ""}
                    </p>
                  </div>

                </div>

                <button
                  onClick={() =>
                    importarEquipo(equipo.id)
                  }
                  disabled={
                    importandoId === equipo.id
                  }
                  className="text-xs bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 font-bold px-3 py-2 rounded-lg transition disabled:opacity-50 flex-shrink-0"
                >
                  {importandoId === equipo.id
                    ? "Importando..."
                    : "Importar"}
                </button>

              </div>

            ))}

          </div>

        </div>
      )}

      {/* ======================================================
          NUEVO EQUIPO
      ====================================================== */}

      {showNuevoEquipo && (
        <div className="bg-gray-900 border border-green-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">
            Nuevo Equipo
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">

            <input
              type="text"
              placeholder="Nombre del equipo *"
              value={nuevoEquipo.name}
              onChange={(e) =>
                setNuevoEquipo({
                  ...nuevoEquipo,
                  name: e.target.value,
                })
              }
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition text-sm"
            />

            <input
              type="text"
              placeholder="Nombre del capitán"
              value={nuevoEquipo.captain}
              onChange={(e) =>
                setNuevoEquipo({
                  ...nuevoEquipo,
                  captain: e.target.value,
                })
              }
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition text-sm"
            />

            <input
              type="text"
              placeholder="WhatsApp (+52...)"
              value={nuevoEquipo.phone}
              onChange={(e) =>
                setNuevoEquipo({
                  ...nuevoEquipo,
                  phone: e.target.value,
                })
              }
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition text-sm"
            />

          </div>

          <div className="flex gap-3">

            <button
              onClick={crearEquipo}
              disabled={loading}
              className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-3 rounded-xl transition text-sm disabled:opacity-50"
            >
              {loading
                ? "Creando..."
                : "Crear"}
            </button>

            <button
              onClick={() =>
                setShowNuevoEquipo(false)
              }
              className="bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold px-5 py-3 rounded-xl transition text-sm"
            >
              Cancelar
            </button>

          </div>
        </div>
      )}

      {/* ======================================================
          LISTA EQUIPOS
      ====================================================== */}

      {torneo.teams.length === 0 ? (

        <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl">
          <p className="text-4xl mb-4">
            👥
          </p>

          <p className="text-gray-400 font-medium">
            No hay equipos aún
          </p>

          <p className="text-gray-600 text-sm mt-1">
            Agrega equipos para poder generar el calendario
          </p>
        </div>

      ) : (

        <div className="space-y-4">

          {torneo.teams.map((team) => (

            <div
              key={team.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"
            >

              {/* ==================================================
                  HEADER EQUIPO
              ================================================== */}

              <div className="px-6 py-4 border-b border-gray-800">

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                  {/* IZQUIERDA */}

                  <div className="flex items-start gap-3">

                    {/* LOGO */}

                    <div
                      onClick={() =>
                        handleLogoClick(team.id)
                      }
                      className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 border border-gray-700 flex items-center justify-center cursor-pointer hover:opacity-80 flex-shrink-0"
                      title="Cambiar escudo"
                    >

                      {logos[team.id] ||
                      team.logo ? (

                        <img
                          src={
                            logos[team.id] ||
                            team.logo!
                          }
                          alt={team.name}
                          className="w-full h-full object-cover"
                        />

                      ) : (

                        <span className="text-sm text-gray-500">
                          ⚽
                        </span>

                      )}

                    </div>

                    {/* INPUT LOGO */}

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={(el) => {
                        logoInputRefs.current[
                          team.id
                        ] = el;
                      }}
                      onChange={(e) => {
                        const file =
                          e.target.files?.[0];

                        if (file) {
                          handleLogoChange(
                            team.id,
                            file
                          );
                        }

                        e.target.value = "";
                      }}
                    />

                    {/* INFORMACIÓN */}

                    <div className="min-w-0">

                      {editandoEquipo ===
                      team.id ? (

                        /* ========================================
                           EDITAR EQUIPO
                        ======================================== */

                        <div className="bg-gray-800 border border-green-700 rounded-xl p-3 space-y-3 w-full max-w-xl">

                          <input
                            autoFocus
                            type="text"
                            placeholder="Nombre del equipo"
                            value={
                              equipoEdit.name
                            }
                            onChange={(e) =>
                              setEquipoEdit({
                                ...equipoEdit,
                                name: e.target.value,
                              })
                            }
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                          />

                          <input
                            type="text"
                            placeholder="Nombre del capitán"
                            value={
                              equipoEdit.captain
                            }
                            onChange={(e) =>
                              setEquipoEdit({
                                ...equipoEdit,
                                captain:
                                  e.target.value,
                              })
                            }
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                          />

                          <input
                            type="tel"
                            placeholder="WhatsApp / Teléfono"
                            value={
                              equipoEdit.phone
                            }
                            onChange={(e) =>
                              setEquipoEdit({
                                ...equipoEdit,
                                phone:
                                  e.target.value,
                              })
                            }
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                          />

                          <div className="flex gap-2">

                            <button
                              onClick={() =>
                                guardarEquipo(
                                  team.id
                                )
                              }
                              disabled={loading}
                              className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg text-xs disabled:opacity-50"
                            >
                              {loading
                                ? "Guardando..."
                                : "✓ Guardar"}
                            </button>

                            <button
                              onClick={() =>
                                setEditandoEquipo(
                                  null
                                )
                              }
                              className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-xs"
                            >
                              Cancelar
                            </button>

                          </div>

                        </div>

                      ) : (

                        /* ========================================
                           NOMBRE NORMAL
                        ======================================== */

                        <>

                          <h3
                            onClick={() => {
                              setEditandoEquipo(
                                team.id
                              );

                              setEquipoEdit({
                                name: team.name,
                                captain:
                                  team.captain ??
                                  "",
                                phone:
                                  team.phone ??
                                  "",
                              });
                            }}
                            className="text-white font-bold text-lg cursor-pointer hover:text-green-400 transition"
                            title="Clic para editar"
                          >
                            {team.name}{" "}
                            <span className="text-gray-600 text-xs font-normal">
                              ✏️
                            </span>
                          </h3>

                          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">

                            <span>
                              {team._count.players}{" "}
                              jugadores
                            </span>

                            {team.captain && (
                              <span>
                                👤{" "}
                                {team.captain}
                              </span>
                            )}

                            {team.phone && (
                              <span>
                                📱{" "}
                                {team.phone}
                              </span>
                            )}

                          </div>

                        </>

                      )}

                    </div>

                  </div>

                  {/* ==================================================
                      BOTONES
                  ================================================== */}

                  <div className="flex flex-wrap gap-2">

                    <button
                      onClick={() =>
                        setEquipoSeleccionado(
                          equipoSeleccionado ===
                            team.id
                            ? null
                            : team.id
                        )
                      }
                      className="text-xs bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 font-bold px-3 py-2 rounded-lg transition"
                    >
                      + Jugador
                    </button>

                    <button
                      onClick={() =>
                        generarCredenciales(
                          team
                        )
                      }
                      disabled={
                        generandoPDF ===
                          team.id ||
                        team.players.length ===
                          0
                      }
                      title={
                        team.players.length ===
                        0
                          ? "Agrega jugadores primero"
                          : "Descargar credenciales en PDF"
                      }
                      className="text-xs bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400 font-bold px-3 py-2 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >

                      {generandoPDF ===
                      team.id ? (

                        <>
                          <svg
                            className="animate-spin h-3 w-3"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />

                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8H4z"
                            />
                          </svg>

                          Generando...
                        </>

                      ) : (

                        <>
                          🪪 Credenciales
                        </>

                      )}

                    </button>

                    <button
                      onClick={() =>
                        eliminarEquipo(
                          team.id
                        )
                      }
                      disabled={loading}
                      className="text-xs bg-red-900/20 hover:bg-red-900/40 text-red-400 font-bold px-3 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      Eliminar
                    </button>

                  </div>

                </div>

              </div>

              {/* ==================================================
                  FORM NUEVO JUGADOR
              ================================================== */}

              {equipoSeleccionado ===
                team.id && (

                <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/30">

                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Agregar Jugador
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                    <input
                      type="text"
                      placeholder="Nombre del jugador"
                      value={
                        nuevoJugador.name
                      }
                      onChange={(e) =>
                        setNuevoJugador({
                          ...nuevoJugador,
                          name: e.target.value,
                        })
                      }
                      className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition text-sm"
                    />

                    <input
                      type="number"
                      placeholder="Número (opcional)"
                      value={
                        nuevoJugador.number
                      }
                      onChange={(e) =>
                        setNuevoJugador({
                          ...nuevoJugador,
                          number:
                            e.target.value,
                        })
                      }
                      className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition text-sm"
                    />

                    <select
                      value={
                        nuevoJugador.position
                      }
                      onChange={(e) =>
                        setNuevoJugador({
                          ...nuevoJugador,
                          position:
                            e.target.value,
                        })
                      }
                      className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-green-500 transition text-sm"
                    >

                      <option value="">
                        Posición (opcional)
                      </option>

                      {POSICIONES.map(
                        (posicion) => (
                          <option
                            key={posicion}
                            value={posicion}
                          >
                            {posicion}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div className="flex gap-2 mt-3">

                    <button
                      onClick={() =>
                        agregarJugador(
                          team.id
                        )
                      }
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-xl transition text-sm disabled:opacity-50"
                    >
                      {loading
                        ? "Agregando..."
                        : "Agregar"}
                    </button>

                    <button
                      onClick={() =>
                        setEquipoSeleccionado(
                          null
                        )
                      }
                      className="bg-gray-700 hover:bg-gray-600 text-gray-400 font-bold px-4 py-2 rounded-xl transition text-sm"
                    >
                      Cancelar
                    </button>

                  </div>

                </div>
              )}

              {/* ==================================================
                  LISTA JUGADORES
              ================================================== */}

              <div className="divide-y divide-gray-800">

                {team.players.length ===
                0 ? (

                  <p className="px-6 py-4 text-gray-600 text-sm">
                    Sin jugadores aún
                  </p>

                ) : (

                  team.players.map(
                    (player) => (

                      <div
                        key={player.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-3"
                      >

                        {/* ================================
                            DATOS JUGADOR
                        ================================= */}

                        <div className="flex items-center gap-3 flex-1 min-w-0">

                          {/* FOTO */}

                          <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-gray-800 border border-gray-700 flex-shrink-0">

                            {fotos[player.id] ||
                            player.photo ? (

                              <img
                                src={
                                  fotos[
                                    player.id
                                  ] ||
                                  player.photo!
                                }
                                alt={
                                  player.name
                                }
                                className="w-full h-full object-cover"
                              />

                            ) : (

                              <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                                👤
                              </div>

                            )}

                          </div>

                          {/* ================================
                              EDITAR JUGADOR
                          ================================= */}

                          {editandoJugador ===
                          player.id ? (

                            <div className="flex flex-wrap items-center gap-2 flex-1">

                              <input
                                autoFocus
                                value={
                                  jugadorEdit.name
                                }
                                onChange={(e) =>
                                  setJugadorEdit({
                                    ...jugadorEdit,
                                    name: e.target.value,
                                  })
                                }
                                placeholder="Nombre"
                                className="bg-gray-800 border border-blue-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none w-40"
                              />

                              <input
                                type="number"
                                value={
                                  jugadorEdit.number
                                }
                                onChange={(e) =>
                                  setJugadorEdit({
                                    ...jugadorEdit,
                                    number:
                                      e.target.value,
                                  })
                                }
                                placeholder="#"
                                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none w-16"
                              />

                              <select
                                value={
                                  jugadorEdit.position
                                }
                                onChange={(e) =>
                                  setJugadorEdit({
                                    ...jugadorEdit,
                                    position:
                                      e.target.value,
                                  })
                                }
                                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none"
                              >

                                <option value="">
                                  Sin posición
                                </option>

                                {POSICIONES.map(
                                  (posicion) => (
                                    <option
                                      key={
                                        posicion
                                      }
                                      value={
                                        posicion
                                      }
                                    >
                                      {posicion}
                                    </option>
                                  )
                                )}

                              </select>

                              <button
                                onClick={() =>
                                  guardarJugador(
                                    team.id,
                                    player.id
                                  )
                                }
                                disabled={loading}
                                className="text-green-400 hover:text-green-300 text-sm font-bold"
                              >
                                ✓
                              </button>

                              <button
                                onClick={() =>
                                  setEditandoJugador(
                                    null
                                  )
                                }
                                className="text-gray-500 hover:text-gray-300 text-sm"
                              >
                                ✕
                              </button>

                            </div>

                          ) : (

                            /* ================================
                               JUGADOR NORMAL
                            ================================= */

                            <>

                              <span className="text-gray-600 text-sm w-6 text-center font-mono flex-shrink-0">
                                {player.number ??
                                  "-"}
                              </span>

                              <div
                                onClick={() => {
                                  setEditandoJugador(
                                    player.id
                                  );

                                  setJugadorEdit({
                                    name: player.name,
                                    number:
                                      player.number?.toString() ??
                                      "",
                                    position:
                                      player.position ??
                                      "",
                                  });
                                }}
                                className="cursor-pointer hover:text-green-400 transition min-w-0"
                                title="Clic para editar"
                              >

                                <p className="text-white text-sm font-medium truncate">

                                  {player.name}{" "}

                                  <span className="text-gray-600 text-xs font-normal">
                                    ✏️
                                  </span>

                                </p>

                                <p className="text-gray-500 text-xs">
                                  {player.position ??
                                    "Sin posición"}
                                </p>

                              </div>

                            </>

                          )}

                        </div>

                        {/* ================================
                            BOTONES JUGADOR
                        ================================= */}

                        <div className="flex items-center gap-2">

                          <button
                            onClick={() =>
                              handleFotoClick(
                                player.id
                              )
                            }
                            className="text-xs bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-400 font-bold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
                          >
                            📷{" "}
                            {fotos[
                              player.id
                            ] ||
                            player.photo
                              ? "Cambiar foto"
                              : "Subir foto"}
                          </button>

                          <input
                            ref={(el) => {
                              fileInputRefs.current[
                                player.id
                              ] = el;
                            }}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => {
                              const file =
                                e.target.files?.[0];

                              if (file) {
                                handleFotoChange(
                                  player.id,
                                  team.id,
                                  file
                                );
                              }

                              e.target.value =
                                "";
                            }}
                          />

                          <button
                            onClick={() =>
                              eliminarJugador(
                                team.id,
                                player.id
                              )
                            }
                            disabled={loading}
                            className="text-xs text-red-400 hover:text-red-300 transition disabled:opacity-50"
                          >
                            Eliminar
                          </button>

                        </div>

                      </div>

                    )
                  )

                )}

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}