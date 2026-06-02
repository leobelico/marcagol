"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Player = {
  id: string;
  name: string;
  number: number | null;
  position: string | null;
  photo?: string | null; // URL de la foto almacenada
};

type Team = {
  id: string;
  name: string;
  captain: string | null;
  phone: string | null;
  logo?: string | null;
  players: Player[];
  _count: { players: number };
};

type Torneo = {
  id: string;
  name: string;
  teams: Team[];
};

// Fotos en memoria (por jugadorId → base64).
// En producción deberías subirlas a tu API/storage y persistirlas en BD.
const fotosEnMemoria: Record<string, string> = {};

export default function EquiposClient({ torneo }: { torneo: Torneo }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState<string | null>(null);
  const [editandoEquipo, setEditandoEquipo] = useState<string | null>(null);
  const [nombreEquipoEdit, setNombreEquipoEdit] = useState("");
  const [editandoJugador, setEditandoJugador] = useState<string | null>(null);
  const [jugadorEdit, setJugadorEdit] = useState({ name: "", number: "", position: "" });
  const [showNuevoEquipo, setShowNuevoEquipo] = useState(false);
  const [nuevoEquipo, setNuevoEquipo] = useState({ name: "", captain: "", phone: "" });

  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string | null>(null);
  const [nuevoJugador, setNuevoJugador] = useState({ name: "", number: "", position: "" });

  // Mapa local de fotos (playerId → dataURL base64)
  const [fotos, setFotos] = useState<Record<string, string>>(fotosEnMemoria);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const POSICIONES = ["Portero", "Defensa", "Mediocampista", "Delantero"];

  const [logos, setLogos] = useState<Record<string, string>>({});

  const logoInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  // ─── Foto de jugador ──────────────────────────────────────────────
  function handleFotoClick(playerId: string) {
    fileInputRefs.current[playerId]?.click();
  }

  async function handleLogoChange(teamId: string, file: File) {
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
    alert("Error subiendo logo");
    return;
  }

  const data = await res.json();

  setLogos((prev) => ({
    ...prev,
    [teamId]: data.logo,
  }));

  router.refresh();
}



async function handleFotoChange(
  playerId: string,
  teamId: string,
  file: File
) {
  try {
    // Preview instantáneo
    const reader = new FileReader();

    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;

      // Mostrar preview local
      setFotos((prev) => ({
        ...prev,
        [playerId]: dataUrl,
      }));

      // Subir a API
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

      // Guardar URL real de Cloudinary
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

  function handleLogoClick(teamId: string) {
  logoInputRefs.current[teamId]?.click();
}
  // ─── Generar PDF de credenciales ──────────────────────────────────
  async function generarCredenciales(team: Team) {
    setGenerandoPDF(team.id);

    // Importar jsPDF dinámicamente (debe estar instalada: npm i jspdf)
    const { jsPDF } = await import("jspdf");

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();   // 210
    const pageHeight = doc.internal.pageSize.getHeight(); // 297

    // Credencial: 85.6 × 54 mm (tamaño ID estándar)
    const cardW = 85.6;
    const cardH = 54;
    const marginX = 10;
    const marginY = 15;
    const cols = 2;
    const gapX = (pageWidth - marginX * 2 - cardW * cols) / (cols - 1);
    const gapY = 8;

    const players = team.players;
    let col = 0;
    let row = 0;

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const x = marginX + col * (cardW + gapX);
      const y = marginY + row * (cardH + gapY);

      // Fondo de la credencial
      doc.setFillColor(15, 23, 42); // slate-900
      doc.roundedRect(x, y, cardW, cardH, 3, 3, "F");

      // Barra superior verde
      doc.setFillColor(22, 163, 74); // green-600
      doc.rect(x, y, cardW, 7, "F");

      // Nombre del torneo
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(torneo.name.toUpperCase(), x + cardW / 2, y + 4.8, { align: "center" });

      // Foto del jugador
      const fotoSize = 22;
      const fotoX = x + 5;
      const fotoY = y + 10;

      const fotoData = fotos[player.id] || player.photo;
      if (fotoData) {
        try {
          // Detectar formato
          const fmt = fotoData.startsWith("data:image/png") ? "PNG" : "JPEG";
          doc.addImage(fotoData, fmt, fotoX, fotoY, fotoSize, fotoSize);
          // Borde foto
          doc.setDrawColor(22, 163, 74);
          doc.setLineWidth(0.5);
          doc.rect(fotoX, fotoY, fotoSize, fotoSize);
        } catch {
          // Si falla la imagen, dibujar placeholder
          doc.setFillColor(31, 41, 55);
          doc.rect(fotoX, fotoY, fotoSize, fotoSize, "F");
          doc.setTextColor(107, 114, 128);
          doc.setFontSize(8);
          doc.text("FOTO", fotoX + fotoSize / 2, fotoY + fotoSize / 2, { align: "center" });
        }
      } else {
        // Placeholder
        doc.setFillColor(31, 41, 55);
        doc.roundedRect(fotoX, fotoY, fotoSize, fotoSize, 2, 2, "F");
        doc.setTextColor(75, 85, 99);
        doc.setFontSize(7);
        doc.text("SIN", fotoX + fotoSize / 2, fotoY + fotoSize / 2 - 1, { align: "center" });
        doc.text("FOTO", fotoX + fotoSize / 2, fotoY + fotoSize / 2 + 3, { align: "center" });
      }

      // Datos del jugador
      const dataX = fotoX + fotoSize + 4;
      const dataW = cardW - fotoSize - 14;

      // Número grande
      if (player.number !== null) {
        doc.setTextColor(22, 163, 74);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text(`#${player.number}`, dataX, fotoY + 10);
      }

      // Nombre
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const nombreLines = doc.splitTextToSize(player.name.toUpperCase(), dataW);
      doc.text(nombreLines.slice(0, 2), dataX, fotoY + (player.number !== null ? 17 : 8));

      // Posición
      if (player.position) {
        doc.setTextColor(34, 197, 94);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text(player.position.toUpperCase(), dataX, fotoY + (player.number !== null ? 24 : 16));
      }

      // Nombre del equipo en la parte inferior
      doc.setFillColor(31, 41, 55);
      doc.rect(x, y + cardH - 9, cardW, 9, "F");
      doc.setTextColor(156, 163, 175);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(team.name.toUpperCase(), x + cardW / 2, y + cardH - 3.5, { align: "center" });

      // Avanzar posición
      col++;
      if (col >= cols) {
        col = 0;
        row++;
        // Nueva página si no caben más filas
        const maxRows = Math.floor((pageHeight - marginY * 2) / (cardH + gapY));
        if (row >= maxRows && i < players.length - 1) {
          doc.addPage();
          row = 0;
        }
      }
    }

    // Si no hay jugadores
    if (players.length === 0) {
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(12);
      doc.text("Este equipo no tiene jugadores registrados.", pageWidth / 2, pageHeight / 2, { align: "center" });
    }

    doc.save(`Credenciales_${team.name.replace(/\s+/g, "_")}.pdf`);
    setGenerandoPDF(null);
  }
async function guardarNombreEquipo(teamId: string) {
  if (!nombreEquipoEdit.trim()) return;
  setLoading(true);
  await fetch(`/api/admin/torneos/${torneo.id}/equipos/${teamId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: nombreEquipoEdit.trim() }),
  });
  setEditandoEquipo(null);
  setLoading(false);
  router.refresh();
}

async function guardarJugador(teamId: string, playerId: string) {
  if (!jugadorEdit.name.trim()) return;
  setLoading(true);
  await fetch(`/api/admin/torneos/${torneo.id}/equipos/${teamId}/jugadores/${playerId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: jugadorEdit.name.trim(),
      number: jugadorEdit.number ? Number(jugadorEdit.number) : null,
      position: jugadorEdit.position || null,
    }),
  });
  setEditandoJugador(null);
  setLoading(false);
  router.refresh();
}
  // ─── CRUD ─────────────────────────────────────────────────────────
  async function crearEquipo() {
    if (!nuevoEquipo.name.trim()) return;
    setLoading(true);
    await fetch(`/api/admin/torneos/${torneo.id}/equipos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nuevoEquipo.name,
        captain: nuevoEquipo.captain || null,
        phone: nuevoEquipo.phone || null,
      }),
    });
    setNuevoEquipo({ name: "", captain: "", phone: "" });
    setShowNuevoEquipo(false);
    setLoading(false);
    router.refresh();
  }

  async function eliminarEquipo(teamId: string) {
    if (!confirm("¿Eliminar este equipo y todos sus jugadores?")) return;
    setLoading(true);
    await fetch(`/api/admin/torneos/${torneo.id}/equipos/${teamId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  async function agregarJugador(teamId: string) {
    if (!nuevoJugador.name.trim()) return;
    setLoading(true);
    await fetch(`/api/admin/torneos/${torneo.id}/equipos/${teamId}/jugadores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nuevoJugador.name,
        number: nuevoJugador.number ? Number(nuevoJugador.number) : null,
        position: nuevoJugador.position || null,
      }),
    });
    setNuevoJugador({ name: "", number: "", position: "" });
    setEquipoSeleccionado(null);
    setLoading(false);
    router.refresh();
  }

  async function eliminarJugador(teamId: string, playerId: string) {
    if (!confirm("¿Eliminar este jugador?")) return;
    setLoading(true);
    await fetch(`/api/admin/torneos/${torneo.id}/equipos/${teamId}/jugadores/${playerId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  // ─── RENDER ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Equipos</h2>
          <p className="text-gray-500 text-sm mt-1">{torneo.teams.length} equipos registrados</p>
        </div>
        <button
          onClick={() => setShowNuevoEquipo(true)}
          className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm"
        >
          + Agregar Equipo
        </button>
      </div>

      {/* Form nuevo equipo */}
      {showNuevoEquipo && (
        <div className="bg-gray-900 border border-green-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Nuevo Equipo</h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <input
              type="text"
              placeholder="Nombre del equipo *"
              value={nuevoEquipo.name}
              onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, name: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition text-sm"
            />
            <input
              type="text"
              placeholder="Nombre del capitán"
              value={nuevoEquipo.captain}
              onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, captain: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition text-sm"
            />
            <input
              type="text"
              placeholder="WhatsApp (+52...)"
              value={nuevoEquipo.phone}
              onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, phone: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={crearEquipo}
              disabled={loading}
              className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-3 rounded-xl transition text-sm"
            >
              Crear
            </button>
            <button
              onClick={() => setShowNuevoEquipo(false)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold px-5 py-3 rounded-xl transition text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de equipos */}
      {torneo.teams.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl">
          <p className="text-4xl mb-4">👥</p>
          <p className="text-gray-400 font-medium">No hay equipos aún</p>
          <p className="text-gray-600 text-sm mt-1">Agrega equipos para poder generar el calendario</p>
        </div>
      ) : (
        <div className="space-y-4">
          {torneo.teams.map((team) => (
            <div key={team.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

              {/* Header del equipo */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                <div>
                <div className="flex items-center gap-2">

                  {/* LOGO CLICKABLE */}
                  <div
                    onClick={() => handleLogoClick(team.id)}
                    className="w-7 h-7 rounded-full overflow-hidden bg-gray-800 border border-gray-700 flex items-center justify-center cursor-pointer hover:opacity-80"
                    title="Cambiar escudo"
                  >
                    {logos[team.id] || team.logo ? (
                      <img
                        src={logos[team.id] || team.logo!}
                        alt={team.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-gray-500">⚽</span>
                    )}
                  </div>

                 {editandoEquipo === team.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={nombreEquipoEdit}
                        onChange={e => setNombreEquipoEdit(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") guardarNombreEquipo(team.id);
                          if (e.key === "Escape") setEditandoEquipo(null);
                        }}
                        className="bg-gray-800 border border-green-600 rounded-lg px-3 py-1 text-white text-sm focus:outline-none w-48"
                      />
                      <button onClick={() => guardarNombreEquipo(team.id)} disabled={loading}
                        className="text-green-400 hover:text-green-300 text-xs font-bold">✓</button>
                      <button onClick={() => setEditandoEquipo(null)}
                        className="text-gray-500 hover:text-gray-300 text-xs">✕</button>
                    </div>
                  ) : (
                    <h3
                      onClick={() => { setEditandoEquipo(team.id); setNombreEquipoEdit(team.name); }}
                      className="text-white font-bold text-lg cursor-pointer hover:text-green-400 transition"
                      title="Clic para editar"
                    >
                      {team.name} <span className="text-gray-600 text-xs font-normal">✏️</span>
                    </h3>
                  )}

                </div>
                    <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                    <span>{team._count.players} jugadores</span>
                    {team.captain && <span>👤 {team.captain}</span>}
                    {team.phone && <span>📱 {team.phone}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {/* Botón Agregar Jugador */}
                  <button
                    onClick={() => setEquipoSeleccionado(equipoSeleccionado === team.id ? null : team.id)}
                    className="text-xs bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 font-bold px-3 py-2 rounded-lg transition"
                  >
                    + Jugador
                  </button>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={(el) => {
                    logoInputRefs.current[team.id] = el;
                  }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoChange(team.id, file);
                    e.target.value = "";
                  }}
                />
                  {/* ── NUEVO: Botón Ver Credenciales ── */}
                  <button
                    onClick={() => generarCredenciales(team)}
                    disabled={generandoPDF === team.id || team.players.length === 0}
                    title={team.players.length === 0 ? "Agrega jugadores primero" : "Descargar credenciales en PDF"}
                    className="text-xs bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400 font-bold px-3 py-2 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {generandoPDF === team.id ? (
                      <>
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
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
                    onClick={() => eliminarEquipo(team.id)}
                    className="text-xs bg-red-900/20 hover:bg-red-900/40 text-red-400 font-bold px-3 py-2 rounded-lg transition"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Form nuevo jugador */}
              {equipoSeleccionado === team.id && (
                <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/30">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Agregar Jugador</p>
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Nombre del jugador"
                      value={nuevoJugador.name}
                      onChange={(e) => setNuevoJugador({ ...nuevoJugador, name: e.target.value })}
                      className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Número (opcional)"
                      value={nuevoJugador.number}
                      onChange={(e) => setNuevoJugador({ ...nuevoJugador, number: e.target.value })}
                      className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition text-sm"
                    />
                    <select
                      value={nuevoJugador.position}
                      onChange={(e) => setNuevoJugador({ ...nuevoJugador, position: e.target.value })}
                      className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-green-500 transition text-sm"
                    >
                      <option value="">Posición (opcional)</option>
                      {POSICIONES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => agregarJugador(team.id)}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-xl transition text-sm"
                    >
                      Agregar
                    </button>
                    <button
                      onClick={() => setEquipoSeleccionado(null)}
                      className="bg-gray-700 hover:bg-gray-600 text-gray-400 font-bold px-4 py-2 rounded-xl transition text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista jugadores */}
              <div className="divide-y divide-gray-800">
                {team.players.length === 0 ? (
                  <p className="px-6 py-4 text-gray-600 text-sm">Sin jugadores aún</p>
                ) : (
                  team.players.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-gray-800 border border-gray-700 flex-shrink-0">
                          {fotos[p.id] || p.photo ? (
                            <img src={fotos[p.id] || p.photo!} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">👤</div>
                          )}
                        </div>

                        {editandoJugador === p.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              autoFocus
                              value={jugadorEdit.name}
                              onChange={e => setJugadorEdit({ ...jugadorEdit, name: e.target.value })}
                              placeholder="Nombre"
                              className="bg-gray-800 border border-blue-600 rounded-lg px-3 py-1 text-white text-sm focus:outline-none w-36"
                            />
                            <input
                              type="number"
                              value={jugadorEdit.number}
                              onChange={e => setJugadorEdit({ ...jugadorEdit, number: e.target.value })}
                              placeholder="#"
                              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white text-sm focus:outline-none w-14"
                            />
                            <select
                              value={jugadorEdit.position}
                              onChange={e => setJugadorEdit({ ...jugadorEdit, position: e.target.value })}
                              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white text-sm focus:outline-none"
                            >
                              <option value="">Sin posición</option>
                              {POSICIONES.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                            </select>
                            <button onClick={() => guardarJugador(team.id, p.id)} disabled={loading}
                              className="text-green-400 hover:text-green-300 text-xs font-bold">✓</button>
                            <button onClick={() => setEditandoJugador(null)}
                              className="text-gray-500 hover:text-gray-300 text-xs">✕</button>
                          </div>
                        ) : (
                          <>
                            <span className="text-gray-600 text-sm w-6 text-center font-mono">{p.number ?? "-"}</span>
                            <div
                              onClick={() => { setEditandoJugador(p.id); setJugadorEdit({ name: p.name, number: p.number?.toString() ?? "", position: p.position ?? "" }); }}
                              className="cursor-pointer hover:text-green-400 transition"
                              title="Clic para editar"
                            >
                              <p className="text-white text-sm font-medium">{p.name} <span className="text-gray-600 text-xs font-normal">✏️</span></p>
                              <p className="text-gray-500 text-xs">{p.position ?? "Sin posición"}</p>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button onClick={() => handleFotoClick(p.id)}
                          className="text-xs bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-400 font-bold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1">
                          📷 {fotos[p.id] || p.photo ? "Cambiar foto" : "Subir foto"}
                        </button>
                        <input
                          ref={(el) => { fileInputRefs.current[p.id] = el; }}
                          type="file" accept="image/*" capture="environment" className="hidden"
                          onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFotoChange(p.id, team.id, file); e.target.value = ""; }}
                        />
                        <button onClick={() => eliminarJugador(team.id, p.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}