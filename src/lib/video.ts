// MarcaGol TV: utilidades para los links de video de partidos y clips.
// Por ahora los videos viven en YouTube (en vivo o grabados); cuando haya
// cámaras en las canchas, los clips se llenarán solos.

// Saca el id de un link de YouTube en sus formas comunes:
// youtube.com/watch?v=ID, youtu.be/ID, youtube.com/live/ID,
// youtube.com/shorts/ID, youtube.com/embed/ID
export function idYoutube(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return limpiarId(u.pathname.slice(1));
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const v = u.searchParams.get("v");
      if (v) return limpiarId(v);
      const m = u.pathname.match(/^\/(live|shorts|embed)\/([^/?#]+)/);
      if (m) return limpiarId(m[2]);
    }
  } catch {
    return null;
  }
  return null;
}

function limpiarId(id: string) {
  return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
}

// Link válido para guardar: http(s) y no muy largo. Vacío = borrar.
export function linkVideoValido(v: unknown): { ok: true; valor: string | null } | { ok: false } {
  if (v === null || v === undefined) return { ok: true, valor: null };
  if (typeof v !== "string") return { ok: false };
  const s = v.trim();
  if (!s) return { ok: true, valor: null };
  if (s.length > 500 || !/^https?:\/\//i.test(s)) return { ok: false };
  return { ok: true, valor: s };
}

export function embedYoutube(url: string | null | undefined): string | null {
  const id = idYoutube(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

export function miniaturaYoutube(url: string | null | undefined): string | null {
  const id = idYoutube(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
