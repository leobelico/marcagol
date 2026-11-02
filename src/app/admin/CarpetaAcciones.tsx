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
        className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm disabled:opacity-50"
      >
        Renombrar
      </button>
      <button
        type="button"
        onClick={eliminar}
        disabled={ocupado}
        className="border border-red-800 bg-red-900/20 hover:bg-red-900/40 text-red-400 font-bold px-5 py-2.5 rounded-xl transition text-sm disabled:opacity-50"
      >
        Eliminar carpeta
      </button>
    </>
  );
}
