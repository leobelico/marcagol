// app/privacidad/page.tsx
//
// Página pública de política de privacidad, requerida por Google Play
// y Apple App Store como URL (no basta un archivo adjunto). Se ubica
// fuera de sitio/ para no depender del subdominio de un tenant —
// debe ser accesible en marcagol.site/privacidad sin importar el torneo.

export const metadata = {
  title: "Política de Privacidad — MarcaGol",
};

export default function PrivacidadPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-gray-300">
      <h1 className="text-3xl font-black text-white mb-2">
        Política de Privacidad de MarcaGol
      </h1>
      <p className="text-sm text-gray-500 mb-10">
        Última actualización: 04/09/2026
      </p>

      <section className="space-y-4 mb-10">
        <h2 className="text-xl font-bold text-white">Introducción</h2>
        <p>
          MarcaGol (&quot;la App&quot;) es una aplicación móvil que permite a
          los usuarios consultar tablas de posiciones, goleo y calendarios de
          torneos de fútbol amateur, y permite a administradores autorizados
          capturar resultados y gestionar plantillas de equipos. Esta
          política explica qué información recopilamos, cómo la usamos y qué
          opciones tienes al respecto.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-xl font-bold text-white">
          Información que recopilamos
        </h2>

        <h3 className="text-lg font-semibold text-white mt-6">
          Para todos los usuarios (sin necesidad de cuenta)
        </h3>
        <p>
          La mayor parte de la App —tablas de posiciones, goleo,
          calendarios— se puede consultar sin crear una cuenta ni
          proporcionar ningún dato personal. No recopilamos información de
          identificación personal de estos usuarios.
        </p>

        <h3 className="text-lg font-semibold text-white mt-6">
          Para administradores (usuarios con cuenta)
        </h3>
        <p>
          Si inicias sesión como administrador de un torneo, recopilamos:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Email o número de teléfono (usado como identificador de inicio de sesión)</li>
          <li>Nombre (el que tengas registrado en tu cuenta)</li>
          <li>Contraseña (almacenada de forma cifrada; nunca en texto plano)</li>
        </ul>
        <p>
          Esta información es la misma que ya utilizas para administrar tu
          torneo en marcagol.site, y se usa exclusivamente para autenticarte
          y darte acceso a las funciones de administración correspondientes
          a tu rol.
        </p>

        <h3 className="text-lg font-semibold text-white mt-6">
          Información que NO recopilamos
        </h3>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>No recopilamos tu ubicación</li>
          <li>No accedemos a tu cámara, micrófono, ni contactos</li>
          <li>No usamos cookies de rastreo ni identificadores publicitarios</li>
          <li>No compartimos ni vendemos información a terceros con fines publicitarios</li>
          <li>No utilizamos software de analítica de terceros (como Google Analytics) ni SDKs de publicidad</li>
        </ul>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-xl font-bold text-white">
          Cómo usamos la información
        </h2>
        <p>La información de administradores se usa únicamente para:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Verificar tu identidad al iniciar sesión (autenticación)</li>
          <li>Determinar qué torneos y equipos puedes administrar</li>
          <li>Mantener tu sesión activa entre usos de la App</li>
        </ul>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-xl font-bold text-white">
          Almacenamiento y seguridad
        </h2>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Las contraseñas se almacenan cifradas (hash), nunca en texto plano</li>
          <li>
            El token de sesión de administrador se guarda de forma cifrada en
            tu dispositivo, usando el almacenamiento seguro del sistema
            operativo (Keychain en iOS, Keystore en Android)
          </li>
          <li>
            La comunicación entre la App y nuestros servidores se realiza
            mediante conexiones cifradas (HTTPS)
          </li>
        </ul>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-xl font-bold text-white">
          Datos de jugadores y equipos
        </h2>
        <p>
          Los nombres, números y posiciones de jugadores que los
          administradores capturan en la App corresponden a información
          pública de los torneos (visible también en marcagol.site) y son
          gestionados bajo la responsabilidad del administrador del torneo
          correspondiente.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-xl font-bold text-white">Menores de edad</h2>
        <p>
          MarcaGol no está dirigida a niños menores de 13 años como usuarios
          de la cuenta de administrador. La información de jugadores menores
          de edad que un administrador capture (como parte de la gestión
          pública de un torneo deportivo) es proporcionada y gestionada por
          adultos responsables del torneo (organizadores, entrenadores o
          tutores), no directamente por los menores.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-xl font-bold text-white">Tus derechos</h2>
        <p>Si eres administrador y deseas:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Solicitar acceso a tu información</li>
          <li>Corregir información incorrecta</li>
          <li>Eliminar tu cuenta y datos asociados</li>
        </ul>
        <p>Puedes contactarnos usando el correo abajo indicado.</p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-xl font-bold text-white">
          Cambios a esta política
        </h2>
        <p>
          Podemos actualizar esta política ocasionalmente. Si hacemos cambios
          significativos, lo indicaremos actualizando la fecha al inicio de
          este documento.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Contacto</h2>
        <p>
          Si tienes preguntas sobre esta política de privacidad, contáctanos
          en:
        </p>
        <p className="font-semibold text-white">
          ldj821@gmail.com
        </p>
      </section>
    </div>
  );
}