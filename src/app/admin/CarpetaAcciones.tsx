"use client";

// Renombrar / eliminar la carpeta que se está viendo en /admin?carpeta=...
// Eliminarla no borra los torneos: quedan sin carpeta.
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CarpetaAcciones({ id, nombre }: { id: string; nombre: string }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);

  async function llamar(method: "PATCH" | "DELETE", body: object) {
    setOcupado(true);
    try {
      const res = await fetch("/api/admin/carpetas", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.error || "No se pudo completar la acción");
        return false;
      }
      return true;
    } finally {
      setOcupado(false);
    }
  }

  async function renombrar() {
    const nuevo = prompt("Nuevo nombre de la carpeta", nombre)?.trim();
    if (!nuevo || nuevo === nombre) return;
    if (await llamar("PATCH", { id, name: nuevo })) router.refresh();
  }

  async function eliminar() {
    if (!confirm(`¿Eliminar la carpeta "${nombre}"? Los torneos que tiene no se borran; quedan sin carpeta.`)) return;
    if (await llamar("DELETE", { id })) {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={renombrar}
        disabled={ocupado}
        className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm font-bold text-white transition hover:border-gray-600 disabled:opacity-50"
      >
        Renombrar
      </button>
      <button
        type="button"
        onClick={eliminar}
        disabled={ocupado}
        className="rounded-xl border border-red-800 bg-red-900/20 px-4 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-900/40 disabled:opacity-50"
      >
        Eliminar carpeta
      </button>
    </>
  );
}
