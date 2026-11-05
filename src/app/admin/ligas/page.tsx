// Datos de cada liga (organización) que ven jugadores y aficionados en la
// app: nombre del organizador, Instagram, Facebook y WhatsApp.
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminHeader from "../AdminHeader";
import { guardarContactoLiga } from "./actions";

const input =
  "w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-green-500 focus:outline-none";
const label = "mb-1 block text-xs font-semibold uppercase tracking-widest text-gray-400";

export default async function LigasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = session.user as { isSuperAdmin?: boolean; organizationId?: string };
  const isSuperAdmin = !!user.isSuperAdmin;
  if (!isSuperAdmin && !user.organizationId) redirect("/admin");

  const ligas = await prisma.organization.findMany({
    where: isSuperAdmin ? {} : { id: user.organizationId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      logo: true,
      contactName: true,
      instagram: true,
      facebook: true,
      whatsapp: true,
      _count: { select: { tenants: { where: { archived: false } } } },
    },
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AdminHeader email={session.user.email} isSuperAdmin={isSuperAdmin} activa="/admin/ligas" />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-black">Ligas</h1>
          <p className="mt-1 text-sm text-gray-400">
            Lo que llenes aquí aparece en la app, en la tarjeta de la liga: quién la organiza y
            botones para abrir su Instagram, Facebook y WhatsApp.
          </p>
        </div>

        {ligas.length === 0 && (
          <p className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center text-gray-400">
            No hay ligas registradas.
          </p>
        )}

        {ligas.map((l) => (
          <form
            key={l.id}
            action={guardarContactoLiga}
            className="space-y-4 rounded-2xl border border-gray-800 bg-gray-900 p-6"
          >
            <input type="hidden" name="id" value={l.id} />
            <div className="flex items-center gap-3">
              {l.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.logo} alt="" className="h-10 w-10 rounded-xl object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-800 font-black text-green-500">
                  {l.name.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-lg font-black">{l.name}</h2>
                <p className="text-xs text-gray-500">{l._count.tenants} torneos activos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={label}>Organizador</label>
                <input name="contactName" defaultValue={l.contactName ?? ""} placeholder="Nombre de quien organiza" className={input} />
              </div>
              <div>
                <label className={label}>WhatsApp</label>
                <input name="whatsapp" defaultValue={l.whatsapp ?? ""} placeholder="444 123 4567" inputMode="tel" className={input} />
              </div>
              <div>
                <label className={label}>Instagram</label>
                <input name="instagram" defaultValue={l.instagram ?? ""} placeholder="@ligarinos o enlace" className={input} />
              </div>
              <div>
                <label className={label}>Facebook</label>
                <input name="facebook" defaultValue={l.facebook ?? ""} placeholder="Enlace de la página" className={input} />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-500"
              >
                Guardar
              </button>
            </div>
          </form>
        ))}
      </main>
    </div>
  );
}
