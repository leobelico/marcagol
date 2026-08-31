"use client";

import { useState } from "react";

export default function ResetPasswordButton({
  userId,
}: {
  userId: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    // Primero preguntamos si quiere una contraseña personalizada
    const passwordPersonalizada = prompt(
      "Escribe la nueva contraseña.\n\n" +
        "• Si la dejas vacía, se generará automáticamente usando:\n" +
        "  Nombre + últimos 3 dígitos del teléfono."
    );

    // Canceló el prompt
    if (passwordPersonalizada === null) {
      return;
    }

    const password = passwordPersonalizada.trim();

    // Confirmación
    const mensaje = password
      ? `¿Cambiar la contraseña a "${password}"?\n\nLa contraseña anterior dejará de funcionar.`
      : "¿Restablecer la contraseña automáticamente?\n\nLa contraseña será:\nNombre + últimos 3 dígitos del teléfono.";

    if (!confirm(mensaje)) {
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/capitanes/${userId}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            password
              ? {
                  password,
                }
              : {}
          ),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "No se pudo cambiar la contraseña"
        );
      }

      alert(
        `Contraseña actualizada correctamente.\n\n` +
          `CAPITÁN: ${data.credentials.name}\n` +
          `EMAIL: ${data.credentials.email}\n` +
          `TELÉFONO: ${data.credentials.phone}\n` +
          `NUEVA CONTRASEÑA: ${data.credentials.password}`
      );
    } catch (error: any) {
      console.error(
        "ERROR CAMBIANDO CONTRASEÑA:",
        error
      );

      alert(
        error?.message ||
          "No se pudo cambiar la contraseña"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className="text-xs bg-orange-900/30 hover:bg-orange-900/50 text-orange-400 font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
    >
      {loading
        ? "Cambiando..."
        : "🔑 Cambiar contraseña"}
    </button>
  );
}

