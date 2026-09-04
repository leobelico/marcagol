// app/eliminar-cuenta/page.tsx
//
// Página pública requerida por Google Play (Data Safety) cuando una
// app permite creación de cuentas: explica cómo solicitar el borrado
// de la cuenta y qué datos se eliminan. Debe ser accesible en
// marcagol.site/eliminar-cuenta sin login.

export const metadata = {
  title: "Eliminar cuenta — MarcaGol",
};

export default function EliminarCuentaPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-gray-300">
      <h1 className="text-3xl font-black text-white mb-2">
        Eliminar tu cuenta de MarcaGol
      </h1>
      <p className="text-sm text-gray-500 mb-10">
        Última actualización: 04/09/2026
      </p>

      <section className="space-y-4 mb-10">
        <p>
          Si tienes una cuenta de administrador en MarcaGol (la que usas para
          iniciar sesión en la app o en marcagol.site) y deseas eliminarla,
          sigue estos pasos:
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-xl font-bold text-white">
          Cómo solicitar la eliminación
        </h2>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>
            Envía un correo a{" "}
            <span className="font-semibold text-white">
              ldj821@gmail.com
            </span>{" "}
            desde el mismo correo registrado en tu cuenta de MarcaGol.
          </li>
          <li>
            Incluye en el asunto: <em>&quot;Solicitud de eliminación de cuenta&quot;</em>.
          </li>
          <li>
            Indica tu nombre completo y el nombre del torneo o equipo que
            administras, para que podamos identificar tu cuenta.
          </li>
        </ol>
        <p>
          Procesaremos tu solicitud en un plazo máximo de 15 días hábiles y
          te confirmaremos por correo cuando se haya completado.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-xl font-bold text-white">
          Qué datos se eliminan
        </h2>
        <p>Al eliminar tu cuenta, se borran de forma permanente:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Tu nombre, email y/o teléfono asociados a la cuenta</li>
          <li>Tu contraseña (almacenada de forma cifrada)</li>
        </ul>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-xl font-bold text-white">
          Qué datos se conservan
        </h2>
        <p>
          Para mantener la integridad histórica de los torneos (resultados,
          estadísticas y tablas de posiciones que son de interés público para
          jugadores y aficionados), la siguiente información puede
          conservarse aunque tu cuenta de administrador sea eliminada:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>
            Resultados de partidos, tablas de posiciones y estadísticas de
            goleo de los torneos que administraste
          </li>
          <li>
            Nombres de equipos y jugadores registrados públicamente en esos
            torneos
          </li>
        </ul>
        <p>
          Esta información no está vinculada a tus credenciales de acceso
          (email/contraseña) una vez que tu cuenta es eliminada.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Contacto</h2>
        <p>
          Si tienes dudas sobre este proceso, contáctanos en:
        </p>
        <p className="font-semibold text-white">
          ldj821@gmail.com
        </p>
      </section>
    </div>
  );
}