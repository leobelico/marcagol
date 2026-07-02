"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoUploader({ torneoId, logoActual }: { torneoId: string; logoActual?: string | null }) {
  const router = useRouter();
  const [subiendo, setSubiendo] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    const form = new FormData();
    form.append("file", file);
    await fetch(`/api/admin/torneos/${torneoId}/logo`, { method: "POST", body: form });
    setSubiendo(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      {logoActual && <img src={logoActual} className="w-16 h-16 rounded-full object-cover" />}
      <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition">
        {subiendo ? "Subiendo..." : "📷 Subir logo"}
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={subiendo} />
      </label>
    </div>
  );
}