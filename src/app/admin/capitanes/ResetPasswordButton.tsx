"use client";

import { useState } from "react";

export default function ResetPasswordButton({
  userId,
}: {
  userId: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (
      !confirm(
        "¿Restablecer la contraseña de este capitán? La contraseña anterior dejará de funcionar."
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/capitanes/${userId}/reset-password`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "No se pudo restablecer la contraseña"
        );
      }

      alert(
        `Contraseña restablecida.\n\n` +
          `CAPITÁN: ${data.credentials.name}\n` +
          `EMAIL: ${data.credentials.email}\n` +
          `TELÉFONO: ${data.credentials.phone}\n` +
          `NUEVA CONTRASEÑA: ${data.credentials.password}`
      );
    } catch (error: any) {
      console.error("ERROR RESETEANDO CONTRASEÑA:", error);
      alert(error?.message || "No se pudo restablecer la contraseña");
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
      {loading ? "Restableciendo..." : "🔑 Restablecer contraseña"}
    </button>
  );
}