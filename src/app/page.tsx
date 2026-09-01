import Link from "next/link";

const features = [
  {
    icon: "🏆",
    title: "Todos tus torneos",
    desc: "Administra múltiples torneos desde una misma plataforma. Cada torneo tiene su propia información, equipos, jugadores y competición.",
  },
  {
    icon: "📅",
    title: "Calendario automático",
    desc: "Genera el fixture de tu torneo y organiza jornadas, partidos, días y horarios sin depender de Excel.",
  },
  {
    icon: "⚽",
    title: "Partidos y resultados",
    desc: "Registra resultados y mantén la información de cada partido actualizada para tus equipos y aficionados.",
  },
  {
    icon: "📊",
    title: "Tabla de posiciones",
    desc: "La clasificación se actualiza automáticamente con los resultados de los partidos.",
  },
  {
    icon: "👥",
    title: "Equipos y plantillas",
    desc: "Registra equipos, administra sus plantillas y mantén toda la información organizada.",
  },
  {
    icon: "🧑‍🤝‍🧑",
    title: "Jugadores",
    desc: "Gestiona perfiles de jugadores, número, posición, fotografía y la información necesaria para competir.",
  },
  {
    icon: "🪪",
    title: "Documentación",
    desc: "Carga y administra documentos de los jugadores, incluyendo INE y documentación oficial.",
  },
  {
    icon: "🔐",
    title: "Roles y permisos",
    desc: "Controla quién puede administrar cada torneo y equipo mediante diferentes niveles de acceso.",
  },
  {
    icon: "🧢",
    title: "Capitanes",
    desc: "Permite que los capitanes gestionen la información correspondiente a sus propios equipos, incluso si manejan varios.",
  },
  {
    icon: "💰",
    title: "Finanzas",
    desc: "Mantén el control de cuotas, gastos y movimientos relacionados con la operación del torneo.",
  },
  {
    icon: "🟨",
    title: "Árbitros",
    desc: "Administra árbitros, asignaciones y pagos relacionados con los partidos.",
  },
  {
    icon: "🌐",
    title: "Página pública",
    desc: "Cada torneo puede tener una presencia pública para compartir información con equipos y aficionados.",
  },
];

const organizationFeatures = [
  "Administra varios torneos",
  "Centraliza equipos y jugadores",
  "Controla accesos y permisos",
  "Mantén la documentación organizada",
  "Consulta toda tu operación desde un solo lugar",
  "Escala conforme crece tu organización",
];

const testimonios = [
  {
    liga: "Liga Norte Intersemanal",
    rol: "Organizador",
    equipos: "18 equipos",
    texto:
      "Antes llevábamos todo en hojas de cálculo distintas para cada torneo. Ahora tengo mis 4 ligas organizadas en un solo lugar y genero el calendario en minutos.",
  },
  {
    liga: "Liga Femenil Infantil",
    rol: "Capitana",
    equipos: "1 equipo",
    texto:
      "Puedo subir la foto y la documentación de cada jugadora desde el celular. Ya no tengo que mandarle todo por WhatsApp al organizador.",
  },
  {
    liga: "Copa Regional Veteranos",
    rol: "Organizador",
    equipos: "32 equipos",
    texto:
      "Lo que más me sirvió fue poder traer un equipo completo de un torneo anterior con un clic, en vez de capturar jugador por jugador otra vez.",
  },
];

const equipo = [
  {
    nombre: "Leonardo Mendoza",
    rol: "Desarrollador",
    numero: "01",
    posicion: "Portero",
    tel: "4443479221",
  },
  {
    nombre: "Ulises Salazar",
    rol: "Ventas",
    numero: "10",
    posicion: "Mediocampo",
    tel: null,
  },
  {
    nombre: "Jorge Ruiz",
    rol: "Ventas",
    numero: "9",
    posicion: "Delantero",
    tel: null,
  },
];

const faqs = [
  {
    q: "¿Cuánto cuesta Marcagol?",
    a: "Marcagol cuesta $200 MXN al mes por torneo. Si administras varios torneos, puedes tenerlos todos dentro de tu organización.",
  },
  {
    q: "¿Puedo administrar varios torneos?",
    a: "Sí. Marcagol está pensado para organizaciones que administran uno o varios torneos, e incluso te permite organizarlos en carpetas.",
  },
  {
    q: "¿Cuántos equipos puedo registrar?",
    a: "La plataforma está diseñada para que puedas administrar tus equipos y jugadores sin tener que llevar la información manualmente en diferentes archivos.",
  },
  {
    q: "¿Los capitanes tienen acceso a todo?",
    a: "No. Los permisos se pueden controlar por rol y los capitanes están limitados a los equipos que tienen asignados, incluso si manejan varios equipos o participan en varias ligas.",
  },
  {
    q: "¿Puedo guardar documentos de jugadores?",
    a: "Sí. Puedes gestionar documentación de jugadores, incluyendo INE y documento oficial, y almacenarla de forma organizada.",
  },
  {
    q: "¿Puedo traer un equipo de un torneo anterior?",
    a: "Sí. Puedes importar un equipo completo con sus jugadores y capitán desde cualquier otro torneo, sin volver a capturar todo desde cero.",
  },
  {
    q: "¿Hay app además de la web?",
    a: "Sí. Además del panel web, Marcagol cuenta con app móvil para que capitanes y organizadores administren sus equipos desde el celular, en la cancha o desde donde estén.",
  },
  {
    q: "¿Puedo cancelar?",
    a: "Sí. Puedes cancelar cuando quieras de acuerdo con las condiciones de tu servicio.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080A0F] text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=Bebas+Neue&display=swap');

        :root {
          --green: #00FF87;
          --green-dark: #00C96A;
          --bg: #080A0F;
          --card: #0E1117;
          --border: #1A1F2E;
        }

        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; background: var(--bg); font-family: "DM Sans", sans-serif; }
        .display { font-family: "Bebas Neue", sans-serif; }

        .grid-bg {
          background-image:
            linear-gradient(rgba(0,255,135,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,135,.035) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .pitch-lines {
          background-image:
            radial-gradient(circle at center, transparent 0, transparent 78px, rgba(0,255,135,.06) 79px, rgba(0,255,135,.06) 80px, transparent 81px),
            repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(255,255,255,.02) 80px);
        }

        .glow {
          text-shadow: 0 0 70px rgba(0,255,135,.35), 0 0 140px rgba(0,255,135,.12);
        }

        .card {
          border: 1px solid var(--border);
          background: rgba(14,17,23,.8);
          transition: all .25s ease;
        }
        .card:hover {
          transform: translateY(-4px);
          border-color: rgba(0,255,135,.28);
          box-shadow: 0 20px 60px rgba(0,0,0,.35);
        }

        .green-button { background: var(--green); color: #000; font-weight: 800; transition: all .2s ease; }
        .green-button:hover { transform: translateY(-2px); box-shadow: 0 0 35px rgba(0,255,135,.35); }

        .green-border {
          border: 1px solid rgba(0,255,135,.28);
          background: linear-gradient(135deg, rgba(0,255,135,.08), rgba(0,255,135,.015));
        }

        .mock-window {
          border: 1px solid var(--border);
          background: #0B0E14;
          border-radius: 1.25rem;
          overflow: hidden;
          box-shadow: 0 30px 90px rgba(0,0,0,.5);
        }
        .mock-titlebar { background: #10141C; border-bottom: 1px solid var(--border); }
        .mock-dot { width: 10px; height: 10px; border-radius: 999px; }

        .scoreboard {
          font-family: "Bebas Neue", sans-serif;
          letter-spacing: .05em;
          background: linear-gradient(180deg, #0F1420, #080A0F);
          border: 1px solid rgba(0,255,135,.25);
        }

        .jersey {
          border: 1px solid var(--border);
          background: radial-gradient(120% 120% at 30% 0%, rgba(0,255,135,.08), transparent 55%), #0E1117;
        }

        .jersey-number {
          font-family: "Bebas Neue", sans-serif;
          -webkit-text-stroke: 1px rgba(0,255,135,.4);
        }

        .whistle-tag {
          background: rgba(0,255,135,.08);
          border: 1px solid rgba(0,255,135,.25);
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#1A1F2E] bg-[#080A0F]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="display text-3xl tracking-widest" style={{ color: "var(--green)" }}>
            MARCAGOL
          </Link>

          <div className="hidden items-center gap-8 text-sm text-gray-400 md:flex">
            <a href="#producto" className="transition hover:text-white">Producto</a>
            <a href="#funcionalidades" className="transition hover:text-white">Funcionalidades</a>
            <a href="#testimonios" className="transition hover:text-white">Testimonios</a>
            <a href="#equipo" className="transition hover:text-white">Equipo</a>
            <a href="#organizaciones" className="transition hover:text-white">Organizaciones</a>
            <a href="#precio" className="transition hover:text-white">Precio</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login" className="px-4 py-2 text-sm text-gray-400 transition hover:text-white">
              Entrar
            </Link>
            <Link href="/login" className="green-button rounded-xl px-5 py-2.5 text-sm">
              Empezar
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="grid-bg relative flex min-h-screen items-center justify-center px-6 pt-24">
        <div className="absolute left-1/2 top-1/2 h-[650px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,255,135,.07),transparent_68%)]" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(0,255,135,.2)] bg-[rgba(0,255,135,.06)] px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-[#00FF87]">
            <span>🟢</span> Web y app · gestión profesional de torneos
          </div>

          <h1 className="display text-7xl leading-[.85] tracking-wider text-white md:text-[10rem]">
            TU LIGA.
            <br />
            <span className="glow text-[#00FF87]">TODO EN UN LUGAR.</span>
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-xl font-light leading-relaxed text-gray-400 md:text-2xl">
            Administra torneos, equipos, jugadores, partidos y documentación
            desde la web o desde el celular.
            <span className="font-medium text-white">
              {" "}
              Sin Excel. Sin información perdida. Sin caos.
            </span>
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/login" className="green-button rounded-2xl px-9 py-4 text-base">
              Crear mi torneo →
            </Link>
            <a
              href="#producto"
              className="rounded-2xl border border-[#1A1F2E] px-9 py-4 text-base text-gray-400 transition hover:border-gray-600 hover:text-white"
            >
              Ver el panel
            </a>
          </div>

          {/* Marcador estilo scoreboard */}
          <div className="scoreboard mx-auto mt-20 grid max-w-3xl grid-cols-3 rounded-2xl py-8">
            <div>
              <div className="display text-5xl text-[#00FF87]">$200</div>
              <div className="mt-1 text-xs tracking-wide text-gray-500">MXN / torneo / mes</div>
            </div>
            <div className="border-x border-[#1A1F2E]">
              <div className="display text-5xl text-[#00FF87]">∞</div>
              <div className="mt-1 text-xs tracking-wide text-gray-500">torneos</div>
            </div>
            <div>
              <div className="display text-5xl text-[#00FF87]">WEB + APP</div>
              <div className="mt-1 text-xs tracking-wide text-gray-500">un solo marcador</div>
            </div>
          </div>
        </div>
      </section>

      {/* APP MÓVIL */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="whistle-tag flex flex-col items-center gap-4 rounded-3xl p-8 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#00FF87]">
                📱 También en tu bolsillo
              </p>
              <h3 className="display mt-2 text-4xl text-white md:text-5xl">
                DISPONIBLE EN APP MÓVIL
              </h3>
              <p className="mt-2 max-w-xl text-sm text-gray-400">
                Capitanes y organizadores pueden dar de alta jugadores, subir
                documentos y revisar el calendario desde el celular, en la
                cancha o antes de que ruede el balón.
              </p>
            </div>

            <Link
              href="/login"
              className="green-button flex-shrink-0 rounded-2xl px-7 py-3 text-sm"
            >
              Usar la app →
            </Link>
          </div>
        </div>
      </section>

      {/* MOCKUP DEL PANEL — EQUIPOS */}
      <section id="producto" className="px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[#00FF87]">El panel</p>
            <h2 className="display text-6xl leading-none md:text-8xl">
              ASÍ SE VE
              <br />
              <span className="text-[#00FF87]">POR DENTRO.</span>
            </h2>
            <p className="mt-6 text-lg text-gray-500">
              Un panel real para administrar equipos, jugadores y toda la
              operación de tu torneo, sin curva de aprendizaje.
            </p>
          </div>

          <div className="mock-window">
            <div className="mock-titlebar flex items-center gap-2 px-5 py-3">
              <span className="mock-dot bg-[#FF5F57]" />
              <span className="mock-dot bg-[#FEBC2E]" />
              <span className="mock-dot bg-[#28C840]" />
              <span className="ml-4 text-xs text-gray-500">marcagol.site/admin/torneos</span>
            </div>

            <div className="p-6 md:p-10">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white">Equipos</h3>
                  <p className="mt-1 text-sm text-gray-500">24 equipos registrados</p>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-xl border border-[#1A1F2E] bg-[#0E1117] px-4 py-2 text-xs font-bold text-gray-400">
                    📥 Traer Equipo
                  </span>
                  <span className="green-button rounded-xl px-4 py-2 text-xs">+ Agregar Equipo</span>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { nombre: "Halcones FC", jugadores: 16, capitan: "Diego R." },
                  { nombre: "Deportivo Norte", jugadores: 14, capitan: "Ana P." },
                  { nombre: "Atlético Rayos", jugadores: 15, capitan: "Marco L." },
                ].map((eq) => (
                  <div
                    key={eq.nombre}
                    className="flex items-center justify-between rounded-2xl border border-[#1A1F2E] bg-[#0E1117] px-5 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1A1F2E] bg-[#080A0F] text-lg">
                        ⚽
                      </div>
                      <div>
                        <p className="font-bold text-white">{eq.nombre}</p>
                        <p className="text-xs text-gray-500">
                          {eq.jugadores} jugadores · 👤 {eq.capitan}
                        </p>
                      </div>
                    </div>
                    <div className="hidden gap-2 sm:flex">
                      <span className="rounded-lg bg-[rgba(59,130,246,.12)] px-3 py-1.5 text-[11px] font-bold text-blue-400">
                        + Jugador
                      </span>
                      <span className="rounded-lg bg-[rgba(234,179,8,.12)] px-3 py-1.5 text-[11px] font-bold text-yellow-400">
                        🪪 Credenciales
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MOCKUP — CALENDARIO Y CAPITANES */}
      <section className="px-6 pb-28">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <div className="mock-window">
            <div className="mock-titlebar flex items-center gap-2 px-5 py-3">
              <span className="mock-dot bg-[#FF5F57]" />
              <span className="mock-dot bg-[#FEBC2E]" />
              <span className="mock-dot bg-[#28C840]" />
              <span className="ml-4 text-xs text-gray-500">Calendario</span>
            </div>
            <div className="p-6">
              <div className="mb-4 flex gap-2">
                <span className="green-button rounded-lg px-3 py-1.5 text-xs">🤖 Automático</span>
                <span className="rounded-lg border border-[#1A1F2E] px-3 py-1.5 text-xs text-gray-500">
                  ✏️ Manual
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { local: "Halcones FC", visita: "Rayos", hora: "18:00", cancha: 1 },
                  { local: "Deportivo Norte", visita: "Águilas", hora: "19:30", cancha: 2 },
                  { local: "Titanes", visita: "Cóndores", hora: "18:00", cancha: 3 },
                ].map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-[#1A1F2E] bg-[#0E1117] px-4 py-3 text-xs"
                  >
                    <span className="font-bold text-white">
                      {m.local} <span className="text-gray-600">vs</span> {m.visita}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#080A0F] px-2 py-1 text-gray-500">C{m.cancha}</span>
                      <span className="rounded-lg border border-[rgba(0,255,135,.25)] bg-[rgba(0,255,135,.08)] px-2 py-1 font-bold text-[#00FF87]">
                        🕒 {m.hora}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mock-window">
            <div className="mock-titlebar flex items-center gap-2 px-5 py-3">
              <span className="mock-dot bg-[#FF5F57]" />
              <span className="mock-dot bg-[#FEBC2E]" />
              <span className="mock-dot bg-[#28C840]" />
              <span className="ml-4 text-xs text-gray-500">Capitanes</span>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {[
                  { nombre: "Diego Ramírez", ligas: "3 ligas", equipos: "4 equipos" },
                  { nombre: "Ana Pérez", ligas: "1 liga", equipos: "1 equipo" },
                ].map((cap) => (
                  <div key={cap.nombre} className="rounded-xl border border-[#1A1F2E] bg-[#0E1117] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-white">{cap.nombre}</p>
                      <span className="rounded-full bg-[rgba(0,255,135,.1)] px-2.5 py-1 text-[10px] font-bold text-[#00FF87]">
                        {cap.equipos}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">
                      {cap.ligas} · acceso solo a sus equipos
                    </p>
                  </div>
                ))}
                <div className="rounded-xl border border-dashed border-[#1A1F2E] p-4 text-center text-[11px] text-gray-600">
                  Cada capitán ve únicamente lo que le corresponde
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-16 md:grid-cols-2">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[#00FF87]">El problema</p>
              <h2 className="display text-6xl leading-none md:text-8xl">
                DEJA ATRÁS
                <br />
                <span className="text-[#00FF87]">EL EXCEL.</span>
              </h2>
            </div>
            <div className="space-y-4 text-gray-400">
              <p>
                Organizar una liga significa manejar equipos, jugadores,
                calendarios, resultados, estadísticas, documentos y pagos.
              </p>
              <p>
                Cuando todo está repartido entre Excel, WhatsApp, fotos y
                diferentes archivos, los errores aparecen rápidamente —
                y cuestan caro cuando ya suena el silbatazo inicial.
              </p>
              <p className="text-lg font-medium text-white">
                Marcagol centraliza la operación de tu torneo en un solo
                sistema, desde la banca hasta la cancha.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="px-6 py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 max-w-3xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[#00FF87]">Plataforma</p>
            <h2 className="display text-6xl leading-none md:text-8xl">
              TODO LO QUE
              <br />
              <span className="text-[#00FF87]">NECESITAS.</span>
            </h2>
            <p className="mt-6 text-lg text-gray-500">
              Desde la inscripción de jugadores hasta la administración de
              partidos y documentos.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="card rounded-2xl p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-[rgba(0,255,135,.2)] bg-[rgba(0,255,135,.06)] text-2xl">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section id="testimonios" className="px-6 py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[#00FF87]">Casos de uso</p>
            <h2 className="display text-6xl leading-none md:text-8xl">
              LIGAS COMO
              <br />
              <span className="text-[#00FF87]">LA TUYA.</span>
            </h2>
            <p className="mt-6 text-lg text-gray-500">
              Ejemplos de cómo distintos tipos de organizador usan Marcagol
              en el día a día.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {testimonios.map((t) => (
              <div key={t.liga} className="card rounded-2xl p-7">
                <div className="mb-5 text-3xl text-[#00FF87]">"</div>
                <p className="text-sm leading-relaxed text-gray-300">{t.texto}</p>
                <div className="mt-6 border-t border-[#1A1F2E] pt-4">
                  <p className="text-sm font-bold text-white">{t.liga}</p>
                  <p className="text-xs text-gray-500">
                    {t.rol} · {t.equipos}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-gray-700">
            Ejemplos ilustrativos de casos de uso típicos en la plataforma.
          </p>
        </div>
      </section>

      {/* EQUIPO (alineación) */}
      <section id="equipo" className="pitch-lines px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[#00FF87]">
              La alineación
            </p>
            <h2 className="display text-6xl md:text-8xl">
              QUIÉN ESTÁ
              <br />
              <span className="text-[#00FF87]">DETRÁS DEL BALÓN.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-gray-500">
              El equipo que arma, mantiene y lleva Marcagol a más ligas cada
              temporada.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {equipo.map((persona) => (
              <div
                key={persona.nombre}
                className="jersey relative overflow-hidden rounded-2xl p-7 text-center"
              >
                <span className="jersey-number pointer-events-none absolute -right-2 -top-6 text-[7rem] leading-none text-transparent">
                  {persona.numero}
                </span>

                <div className="relative">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(0,255,135,.3)] bg-[rgba(0,255,135,.08)] text-2xl font-black text-[#00FF87]">
                    {persona.numero}
                  </div>

                  <h3 className="text-lg font-bold text-white">{persona.nombre}</h3>

                  <p className="mt-1 text-xs font-bold uppercase tracking-[.15em] text-[#00FF87]">
                    {persona.rol}
                  </p>

                  <p className="mt-1 text-xs text-gray-600">{persona.posicion}</p>

                  {persona.tel && (
                    <a
                      href={`https://wa.me/52${persona.tel}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#1A1F2E] bg-[#080A0F] px-4 py-2 text-xs font-bold text-gray-300 transition hover:border-[rgba(0,255,135,.35)] hover:text-white"
                    >
                      📱 {persona.tel}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ORGANIZACIONES */}
      <section id="organizaciones" className="px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <div className="green-border overflow-hidden rounded-[2rem]">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-14">
                <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[#00FF87]">
                  Para organizaciones
                </p>
                <h2 className="display text-6xl leading-none md:text-8xl">
                  UNA LIGA
                  <br />
                  <span className="text-[#00FF87]">NO ES SUFICIENTE.</span>
                </h2>
                <p className="mt-6 leading-relaxed text-gray-400">
                  Si administras varios torneos, Marcagol te permite
                  centralizar toda tu operación, organizar tus ligas en
                  carpetas y crecer sin multiplicar el trabajo administrativo.
                </p>
                <Link href="/login" className="green-button mt-8 inline-block rounded-xl px-7 py-3">
                  Administrar mis torneos →
                </Link>
              </div>

              <div className="border-t border-[rgba(0,255,135,.15)] p-8 md:border-l md:border-t-0 md:p-14">
                <div className="space-y-5">
                  {organizationFeatures.map((item) => (
                    <div key={item} className="flex items-center gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00FF87] text-sm font-black text-black">
                        ✓
                      </span>
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-12 border-t border-[#1A1F2E] pt-8">
                  <div className="display text-6xl text-[#00FF87]">$2,000</div>
                  <p className="mt-1 text-sm text-gray-500">ejemplo: 10 torneos activos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section className="px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[#00FF87]">
              Control de acceso
            </p>
            <h2 className="display text-6xl md:text-8xl">
              CADA PERSONA
              <br />
              <span className="text-[#00FF87]">VE LO QUE NECESITA.</span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="card rounded-2xl p-7">
              <div className="text-3xl">👑</div>
              <h3 className="mt-5 text-xl font-bold">Administrador</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                Gestiona la operación del torneo y sus recursos.
              </p>
            </div>
            <div className="card rounded-2xl p-7">
              <div className="text-3xl">🧢</div>
              <h3 className="mt-5 text-xl font-bold">Capitán</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                Accede únicamente a los equipos que tiene asignados, aunque
                maneje más de uno o participe en varias ligas.
              </p>
            </div>
            <div className="card rounded-2xl p-7">
              <div className="text-3xl">⚡</div>
              <h3 className="mt-5 text-xl font-bold">Superadministrador</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                Control centralizado de la plataforma.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DOCUMENTOS */}
      <section className="px-6 py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[#00FF87]">
              Documentación
            </p>
            <h2 className="display text-6xl leading-none md:text-8xl">
              JUGADORES
              <br />
              <span className="text-[#00FF87]">EN ORDEN.</span>
            </h2>
            <p className="mt-6 leading-relaxed text-gray-500">
              Centraliza la información y documentación de tus jugadores en
              lugar de depender de fotografías y archivos dispersos.
            </p>
          </div>

          <div className="card rounded-3xl p-8">
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#1A1F2E] bg-[#080A0F] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">Jugador</p>
                    <p className="text-sm text-gray-500">Información del jugador</p>
                  </div>
                  <span className="rounded-full bg-[rgba(0,255,135,.1)] px-3 py-1 text-xs text-[#00FF87]">
                    Registrado
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[#1A1F2E] bg-[#080A0F] p-5">
                  <div className="text-2xl">🪪</div>
                  <p className="mt-3 text-sm font-bold">INE</p>
                  <p className="mt-1 text-xs text-gray-600">Documento almacenado</p>
                </div>
                <div className="rounded-2xl border border-[#1A1F2E] bg-[#080A0F] p-5">
                  <div className="text-2xl">📄</div>
                  <p className="mt-3 text-sm font-bold">Documento oficial</p>
                  <p className="mt-1 text-xs text-gray-600">Documento almacenado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRECIO */}
      <section id="precio" className="px-6 py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[#00FF87]">Precio</p>
            <h2 className="display text-6xl md:text-8xl">
              PAGA POR LO QUE
              <br />
              <span className="text-[#00FF87]">ADMINISTRAS.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-gray-500">
              Sin paquetes complicados. Tu costo crece conforme crece tu operación.
            </p>
          </div>

          <div className="green-border rounded-3xl p-8 md:p-12">
            <div className="flex flex-col justify-between gap-10 md:flex-row md:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-[#00FF87]">Por torneo</p>
                <div className="mt-3 flex items-end gap-3">
                  <span className="display text-8xl">$200</span>
                  <span className="mb-4 text-gray-500">MXN / mes</span>
                </div>
                <p className="max-w-md text-gray-500">
                  Administra tantos torneos como necesites y escala tu
                  operación conforme crece tu organización.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  "Torneos",
                  "Equipos",
                  "Jugadores",
                  "Calendarios",
                  "Resultados",
                  "Documentación",
                  "Roles y permisos",
                  "Web y app móvil",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-gray-300">
                    <span className="text-[#00FF87]">✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <Link href="/login" className="green-button mt-10 block rounded-2xl px-8 py-4 text-center">
              Empezar con Marcagol →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-28">
        <div className="mx-auto max-w-3xl">
          <div className="mb-14 text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[#00FF87]">FAQ</p>
            <h2 className="display text-6xl md:text-8xl">
              PREGUNTAS
              <br />
              <span className="text-[#00FF87]">FRECUENTES.</span>
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="card overflow-hidden rounded-2xl">
                <summary className="cursor-pointer px-6 py-5 font-semibold text-white">
                  {faq.q}
                </summary>
                <p className="px-6 pb-6 text-sm leading-relaxed text-gray-500">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-28">
        <div className="green-border relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] p-10 text-center md:p-20">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,255,135,.08),transparent_68%)]" />

          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#00FF87]">
              Tu siguiente torneo
            </p>
            <h2 className="display mt-4 text-7xl leading-none md:text-[9rem]">
              ORGANÍZALO
              <br />
              <span className="glow text-[#00FF87]">PROFESIONALMENTE.</span>
            </h2>
            <p className="mx-auto mt-7 max-w-xl text-gray-400">
              Deja de administrar tu liga en diferentes archivos.
              Centraliza todo con Marcagol, desde la web o desde tu celular.
            </p>
            <Link href="/login" className="green-button mt-9 inline-block rounded-2xl px-10 py-4 text-lg">
              Crear mi torneo →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#1A1F2E] px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <div className="display text-3xl tracking-widest text-[#00FF87]">MARCAGOL</div>
            <p className="mt-1 text-xs text-gray-600">Gestión profesional de torneos deportivos</p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <a href="#funcionalidades" className="hover:text-white">Funcionalidades</a>
            <a href="#testimonios" className="hover:text-white">Testimonios</a>
            <a href="#equipo" className="hover:text-white">Equipo</a>
            <a href="#precio" className="hover:text-white">Precio</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
            <Link href="/login" className="hover:text-white">Entrar</Link>
          </div>

          <p className="text-xs text-gray-700">© 2026 Marcagol</p>
        </div>
      </footer>
    </main>
  );
}