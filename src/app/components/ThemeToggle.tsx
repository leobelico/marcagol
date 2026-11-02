"use client";

// Botón para elegir apariencia: Sistema → Claro → Oscuro.
// La elección vive en data-theme de <html> (el script de layout.tsx la
// aplica antes de pintar) y se guarda en localStorage.
import { useSyncExternalStore } from "react";

type Pref = "system" | "light" | "dark";
const KEY = "mg-theme";
const LABEL: Record<Pref, string> = {
  system: "Apariencia: sistema",
  light: "Apariencia: claro",
  dark: "Apariencia: oscuro",
};

function leer(): Pref {
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "dark" ? t : "system";
}

function suscribir(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const pref = useSyncExternalStore(suscribir, leer, () => "system" as Pref);

  function siguiente() {
    const next: Pref = pref === "system" ? "light" : pref === "light" ? "dark" : "system";
    if (next === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;
    try {
      if (next === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {
      // sin almacenamiento: el tema aplica solo en esta visita
    }
  }

  return (
    <button
      type="button"
      onClick={siguiente}
      title={LABEL[pref]}
      aria-label={LABEL[pref]}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-700 bg-gray-900 text-gray-400 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 ${className}`}
    >
      {pref === "light" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : pref === "dark" ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" />
        </svg>
      )}
    </button>
  );
}
