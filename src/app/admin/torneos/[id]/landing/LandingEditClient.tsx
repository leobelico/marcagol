"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Torneo = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startDate: string | null;  // ← string no Date
  endDate: string | null;    // ← string no Date
  maxTeams: number | null;
  inscriptionFee: number | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  instagram: string | null;
  facebook: string | null;
  whatsapp: string | null;
  bannerUrl: string | null;
  published: boolean;
};

// Dominio de los sitios de torneo (ej. marcagol.site → liga.marcagol.site)
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "marcagol.site";
const PROTOCOLO = /localhost|lvh\.me/.test(APP_DOMAIN) ? "http" : "https";

// Las fechas del flyer son días (AAAA-MM-DD) guardados a medianoche UTC
const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default function LandingEditClient({ torneo }: { torneo: Torneo }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const urlFlyer = `${PROTOCOLO}://${torneo.slug}.${APP_DOMAIN}/info`;
  const [form, setForm] = useState({
    description: torneo.description ?? "",
    endDate: torneo.endDate ? torneo.endDate.slice(0, 10) : "",
    maxTeams: torneo.maxTeams?.toString() ?? "",
    inscriptionFee: torneo.inscriptionFee?.toString() ?? "",
    contactName: torneo.contactName ?? "",
    contactPhone: torneo.contactPhone ?? "",
    contactEmail: torneo.contactEmail ?? "",
    instagram: torneo.instagram ?? "",
    facebook: torneo.facebook ?? "",
    whatsapp: torneo.whatsapp ?? "",
    bannerUrl: torneo.bannerUrl ?? "",
    published: torneo.published,
  });

  async function guardar() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/torneos/${torneo.id}/landing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          maxTeams: form.maxTeams ? Number(form.maxTeams) : null,
          inscriptionFee: form.inscriptionFee !== "" ? Number(form.inscriptionFee) : null,
          endDate: form.endDate || null,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "No se pudieron guardar los cambios. Intenta de nuevo.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } catch {
      setError("Sin conexión. Revisa tu internet e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Flyer Digital</h2>
          <p className="text-gray-500 text-sm mt-1">Configura la landing page pública de tu torneo</p>
        </div>
        <div className="flex items-center gap-3">
        <a href={`${urlFlyer}?vista-previa=1`} target="_blank" rel="noopener noreferrer"
        className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 px-4 py-2.5 rounded-xl transition font-bold">
        Ver vista previa →
        </a>
          <button onClick={guardar} disabled={loading}
            className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">
            {saved ? "✓ Guardado" : loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Publicado toggle */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-white font-bold">Estado del flyer</p>
          <p className="text-gray-500 text-sm mt-0.5">
            {form.published
              ? `Visible en ${urlFlyer.replace(/^https?:\/\//, "")} y en el menú del sitio`
              : "Oculto. Solo se ve con el botón de vista previa."}
          </p>
        </div>
        <button
          onClick={() => setForm({ ...form, published: !form.published })}
          className={`relative w-14 h-7 rounded-full transition-colors ${form.published ? "bg-green-600" : "bg-gray-700"}`}>
          <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${form.published ? "translate-x-8" : "translate-x-1"}`} />
        </button>
      </div>

      {/* Información general */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Información General</h3>

        <div>
          <label className="text-xs text-gray-500 block mb-1">Descripción del torneo</label>
          <textarea
            rows={3}
            placeholder="Describe tu torneo — categoría, reglas generales, premios..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Fecha de fin</label>
            <input type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Cupos máximos</label>
            <input type="number" min={2} placeholder="16"
              value={form.maxTeams}
              onChange={(e) => setForm({ ...form, maxTeams: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Precio de inscripción ($)</label>
            <input type="number" min={0} placeholder="0.00"
              value={form.inscriptionFee}
              onChange={(e) => setForm({ ...form, inscriptionFee: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">URL del banner (imagen)</label>
            <input type="url" placeholder="https://..."
              value={form.bannerUrl}
              onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
            />
          </div>
        </div>
      </div>

      {/* Contacto */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contacto del Organizador</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Nombre</label>
            <input type="text" placeholder="Nombre del organizador"
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Teléfono / WhatsApp</label>
            <input type="text" placeholder="+52 81 1234 5678"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 block mb-1">Email</label>
            <input type="email" placeholder="contacto@torneo.com"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
            />
          </div>
        </div>
      </div>

      {/* Redes sociales */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Redes Sociales</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">📸 Instagram</label>
            <input type="text" placeholder="@torneo_regia"
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">📘 Facebook</label>
            <input type="text" placeholder="facebook.com/torneoRegia"
              value={form.facebook}
              onChange={(e) => setForm({ ...form, facebook: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">💬 WhatsApp (número o link)</label>
            <input type="text" placeholder="81 1234 5678"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
            />
          </div>
        </div>
      </div>

      {/* Preview del flyer */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Preview del Flyer</h3>
        <div className="rounded-2xl overflow-hidden border border-gray-700">
          <div
            data-theme="dark"
            className="relative p-6 sm:p-8 min-h-48"
            style={{
              background: form.bannerUrl
                ? `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.9)), url(${form.bannerUrl}) center/cover`
                : "radial-gradient(90% 90% at 85% 0%, rgba(34,197,94,.28), transparent 60%), linear-gradient(160deg, #13306a, #0b1022)",
            }}>
            <p className="text-green-400 text-xs font-bold tracking-widest uppercase mb-2">⚽ Torneo de Fútbol</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">{torneo.name}</h2>
            {form.description && <p className="text-gray-300 mt-3 text-sm max-w-lg">{form.description}</p>}
            <div className="flex flex-wrap gap-4 mt-6 text-sm">
            {torneo.startDate && (
            <span className="bg-white/10 text-white px-3 py-1.5 rounded-lg">
                📅 Inicio: {fechaCorta(torneo.startDate)}
            </span>
            )}
              {form.endDate && (
                <span className="bg-white/10 text-white px-3 py-1.5 rounded-lg">
                  🏁 Fin: {fechaCorta(form.endDate)}
                </span>
              )}
              {form.maxTeams && (
                <span className="bg-white/10 text-white px-3 py-1.5 rounded-lg">
                  👥 {form.maxTeams} equipos máx.
                </span>
              )}
              {form.inscriptionFee !== "" && (
                <span className="bg-green-600/80 text-white px-3 py-1.5 rounded-lg font-bold">
                  💰 {Number(form.inscriptionFee) > 0 ? formatMoney(Number(form.inscriptionFee)) : "Inscripción gratis"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}