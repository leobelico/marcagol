"use client";

// Menú del sitio público de cada torneo. En el celular el nombre va
// arriba y las secciones abajo como pestañas deslizables; en pantallas
// grandes todo cabe en una fila.
import Link from "next/link";
import { usePathname } from "next/navigation";

const SECCIONES = [
  { href: "/", label: "Inicio" },
  { href: "/rol-semanal", label: "Rol semanal" },
  { href: "/goleadores", label: "Goleadores" },
  { href: "/calendario", label: "Calendario" },
];

export default function SitioNav({ nombre, logo }: { nombre: string; logo: string | null }) {
  const pathname = usePathname();
  // En el subdominio la ruta visible no lleva /sitio, pero por si se entra directo
  const ruta = pathname.replace(/^\/sitio/, "") || "/";

  return (
    <nav
      className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900/90 backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex max-w-5xl flex-col px-4 md:flex-row md:items-center md:justify-between md:gap-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 py-3 text-lg font-black text-white">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-green-600 text-sm text-white">⚽</span>
          )}
          <span className="truncate">{nombre}</span>
        </Link>
        <div className="-mx-4 flex gap-1 overflow-x-auto px-4 text-sm font-semibold [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
          {SECCIONES.map((s) => {
            const activa = s.href === "/" ? ruta === "/" : ruta.startsWith(s.href);
            return (
              <Link
                key={s.href}
                href={s.href}
                className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 transition md:py-4 ${
                  activa
                    ? "border-green-500 text-white"
                    : "border-transparent text-gray-500 hover:text-white"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
