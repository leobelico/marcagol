import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

// Flyer de inscripción del torneo (se edita en /admin/torneos/[id]/landing
// o desde la app). Si no está publicado solo se ve con ?vista-previa=1,
// que es el enlace que usa el botón "Ver vista previa" del editor.

// Las fechas del flyer se capturan como día (AAAA-MM-DD) y se guardan a
// medianoche UTC; se muestran en UTC para que no se recorran un día.
function fecha(d: Date) {
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function dinero(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}

/** Acepta un link (https://wa.me/...) o un número (81 1234 5678) */
function linkWhatsApp(valor: string, mensaje: string) {
  const texto = encodeURIComponent(mensaje);
  if (/^https?:\/\//i.test(valor)) {
    return valor.includes("?") ? valor : `${valor}?text=${texto}`;
  }
  let digitos = valor.replace(/\D/g, "");
  if (!digitos) return null;
  if (digitos.length === 10) digitos = `52${digitos}`;
  return `https://wa.me/${digitos}?text=${texto}`;
}

function linkInstagram(valor: string) {
  if (/instagram\.com/i.test(valor)) return valor.startsWith("http") ? valor : `https://${valor}`;
  return `https://instagram.com/${valor.replace(/^@/, "").trim()}`;
}

function linkFacebook(valor: string) {
  return valor.startsWith("http") ? valor : `https://${valor.replace(/^\/+/, "")}`;
}

export default async function InfoPage({
  searchParams,
}: {
  searchParams: Promise<{ "vista-previa"?: string }>;
}) {
  const tenant = await getTenant();
  if (!tenant) notFound();

  const vistaPrevia = (await searchParams)["vista-previa"] === "1";

  const torneo = await prisma.tenant.findUnique({
    where: { id: tenant.id },
    include: {
      teams: {
        where: { disqualified: false },
        select: { id: true, name: true, logo: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!torneo || (!torneo.published && !vistaPrevia)) notFound();

  const inscritos = torneo.teams.length;
  const lugares = torneo.maxTeams != null ? Math.max(0, torneo.maxTeams - inscritos) : null;
  const lleno = lugares === 0;
  const abiertas = torneo.registrationOpen && !lleno;

  const mensaje = `Hola, quiero inscribir un equipo en ${torneo.name}`;
  const whatsapp =
    (torneo.whatsapp && linkWhatsApp(torneo.whatsapp, mensaje)) ||
    (torneo.contactPhone && linkWhatsApp(torneo.contactPhone, mensaje)) ||
    null;

  const estado = lleno
    ? { texto: "Cupo lleno", clase: "bg-red-500/20 text-red-300" }
    : abiertas
    ? { texto: "Inscripciones abiertas", clase: "bg-green-500/20 text-green-300" }
    : { texto: "Inscripciones cerradas", clase: "bg-gray-500/30 text-gray-300" };

  const datos: { label: string; valor: string; destacado?: boolean }[] = [];
  if (torneo.inscriptionFee != null) {
    datos.push({
      label: "Inscripción",
      valor: torneo.inscriptionFee > 0 ? dinero(torneo.inscriptionFee) : "Gratis",
      destacado: true,
    });
  }
  if (torneo.maxTeams != null) {
    datos.push({
      label: "Lugares",
      valor: lleno ? "Lleno" : `${lugares} de ${torneo.maxTeams}`,
    });
  }
  if (torneo.startDate) datos.push({ label: "Inicio", valor: fecha(torneo.startDate) });
  if (torneo.endDate) datos.push({ label: "Fin", valor: fecha(torneo.endDate) });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {!torneo.published && (
        <div className="rounded-xl border border-yellow-800 bg-yellow-900/30 px-4 py-3 text-sm text-yellow-300">
          Vista previa: este flyer aún no está publicado. Actívalo en el editor para que lo vea todo el público.
        </div>
      )}

      {/* Portada: siempre en paleta oscura para que el texto se lea sobre la imagen */}
      <div
        data-theme="dark"
        className="relative flex min-h-72 flex-col justify-end overflow-hidden rounded-2xl p-6 text-white sm:p-8"
        style={{
          background: torneo.bannerUrl
            ? `linear-gradient(to bottom, rgba(8,12,30,.25), rgba(8,12,30,.92)), url(${JSON.stringify(torneo.bannerUrl)}) center/cover`
            : "radial-gradient(90% 90% at 85% 0%, rgba(34,197,94,.28), transparent 60%), linear-gradient(160deg, #13306a, #0b1022)",
        }}
      >
        <span className={`mb-3 inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${estado.clase}`}>
          {estado.texto}
        </span>
        <h1 className="text-3xl font-black leading-tight sm:text-5xl [text-wrap:balance]">{torneo.name}</h1>
        {torneo.description && (
          <p className="mt-3 max-w-xl whitespace-pre-line text-sm leading-relaxed text-gray-300 sm:text-base">
            {torneo.description}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          {abiertas && whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700"
            >
              Inscribir mi equipo
            </a>
          )}
          <Link
            href="/"
            className="rounded-xl border border-gray-600 bg-gray-900/60 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
          >
            Ver tabla y partidos
          </Link>
        </div>
      </div>

      {datos.length > 0 && (
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {datos.map((d) => (
            <div key={d.label} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">{d.label}</dt>
              <dd className={`mt-1 font-bold ${d.destacado ? "text-xl text-green-500" : "text-white"}`}>{d.valor}</dd>
            </div>
          ))}
        </dl>
      )}

      {inscritos > 0 && (
        <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
            Equipos inscritos ({inscritos}
            {torneo.maxTeams ? ` de ${torneo.maxTeams}` : ""})
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {torneo.teams.map((t) => (
              <div key={t.id} className="flex min-w-0 items-center gap-2.5 rounded-xl bg-gray-800 px-3 py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-700 bg-gray-900">
                  {t.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.logo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[11px]">⚽</span>
                  )}
                </span>
                <span className="truncate text-sm font-medium text-white">{t.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {(torneo.contactName || torneo.contactPhone || torneo.contactEmail) && (
        <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Contacto</h2>
          <div className="space-y-2 text-sm">
            {torneo.contactName && <p className="text-lg font-bold text-white">{torneo.contactName}</p>}
            {torneo.contactPhone && (
              <p className="text-gray-300">
                Teléfono: <span className="font-semibold text-white">{torneo.contactPhone}</span>
                {" · "}
                <a href={`tel:${torneo.contactPhone.replace(/[^\d+]/g, "")}`} className="font-semibold text-green-500 hover:underline">
                  Llamar
                </a>
              </p>
            )}
            {torneo.contactEmail && (
              <p className="text-gray-300">
                Correo: <span className="font-semibold text-white">{torneo.contactEmail}</span>
              </p>
            )}
          </div>
        </section>
      )}

      {(torneo.instagram || torneo.facebook || whatsapp) && (
        <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Redes</h2>
          <div className="flex flex-wrap gap-3">
            {torneo.instagram && (
              <a href={linkInstagram(torneo.instagram)} target="_blank" rel="noopener noreferrer"
                className="rounded-xl bg-gray-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gray-700">
                Instagram {torneo.instagram.startsWith("@") ? torneo.instagram : ""}
              </a>
            )}
            {torneo.facebook && (
              <a href={linkFacebook(torneo.facebook)} target="_blank" rel="noopener noreferrer"
                className="rounded-xl bg-gray-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gray-700">
                Facebook
              </a>
            )}
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer"
                className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-700">
                WhatsApp
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
