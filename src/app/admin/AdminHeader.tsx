// Encabezado del panel de administración: marca, navegación entre
// secciones (solo SUPER_ADMIN) y sesión. En el celular la navegación
// pasa a una fila de pestañas deslizables.
import Link from "next/link";

const SECCIONES = [
  { href: "/admin", label: "Torneos" },
  { href: "/admin/ligas", label: "Ligas" },
  { href: "/admin/capitanes", label: "Capitanes" },
  { href: "/admin/subadmins", label: "Sub admins" },
  { href: "/admin/armado", label: "Armado de rol" },
  { href: "/admin/roladmin", label: "Rol administrativo" },
  { href: "/admin/importar", label: "Importar" },
];

export default function AdminHeader({
  email,
  isSuperAdmin,
  activa = "/admin",
}: {
  email: string | null | undefined;
  isSuperAdmin: boolean;
  activa?: string;
}) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-gray-800 bg-gray-900/95 backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link href="/admin" className="flex shrink-0 items-center gap-2 font-extrabold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-green-600 text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7.5l4 2.9-1.5 4.7h-5L8 10.4z" fill="currentColor" />
            </svg>
          </span>
          <span>
            Marca<span className="text-green-500">Gol</span>
          </span>
          <span className="hidden rounded-md bg-gray-800 px-1.5 py-0.5 text-[11px] font-bold text-gray-400 sm:inline">
            {isSuperAdmin ? "Super admin" : "Admin"}
          </span>
        </Link>

        {isSuperAdmin && (
          <nav className="hidden items-center gap-1 text-sm font-semibold lg:flex">
            {SECCIONES.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className={`rounded-lg px-3 py-1.5 transition ${
                  s.href === activa ? "bg-gray-800 text-white" : "text-gray-500 hover:text-white"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex min-w-0 items-center gap-3">
          <span className="hidden truncate text-sm text-gray-500 md:block">{email}</span>
          <Link
            href="/api/auth/signout"
            className="shrink-0 rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-400 transition hover:text-white"
          >
            Cerrar sesión
          </Link>
        </div>
      </div>

      {isSuperAdmin && (
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 text-sm font-semibold [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
          {SECCIONES.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 transition ${
                s.href === activa ? "border-green-500 text-white" : "border-transparent text-gray-500"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
