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

export default function SitioNav({
  nombre,
  logo,
  flyer,
}: {
  nombre: string;
  logo: string | null;
  /** true si el flyer de inscripción está publicado */
  flyer: boolean;
}) {
  const pathname = usePathname();
  const secciones = flyer ? [...SECCIONES, { href: "/info", label: "Inscripción" }] : SECCIONES;
  // En el subdominio la ruta visible no lleva /sitio, pero por si se entra directo
  const ruta = pathname.replace(/^\/sitio/, "") || "/";

  return (
    <nav
      className="sticky top-0 z-40 border-b-2 border-white bg-gray-950/95 backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex max-w-5xl flex-col px-4 md:flex-row md:items-center md:justify-between md:gap-6">
        <Link href="/" className="t-titulo flex min-w-0 items-center gap-2.5 py-3 text-2xl text-white">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-green-600 text-sm normal-case text-white">⚽</span>
          )}
          <span className="truncate">{nombre}</span>
        </Link>
        <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 text-sm font-bold md:pb-0 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
          {secciones.map((s) => {
            const activa = s.href === "/" ? ruta === "/" : ruta.startsWith(s.href);
            return (
              <Link
                key={s.href}
                href={s.href}
                aria-current={activa ? "page" : undefined}
                className={`flex min-h-11 shrink-0 items-center whitespace-nowrap rounded px-3 transition ${
                  activa
                    ? "bg-white text-gray-950"
                    : "text-gray-400 hover:text-white"
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
