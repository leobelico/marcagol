import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080A0F] text-white overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,900;1,9..40,300&family=Bebas+Neue&display=swap');

        :root {
          --green: #00FF87;
          --green-dim: #00C96A;
          --dark: #080A0F;
          --card: #0E1117;
          --border: #1A1F2E;
        }

        .font-display { font-family: 'Bebas Neue', sans-serif; }

        .glow {
          text-shadow: 0 0 80px rgba(0,255,135,0.4), 0 0 160px rgba(0,255,135,0.15);
        }

        .card-glow {
          box-shadow: 0 0 0 1px var(--border), 0 20px 60px rgba(0,0,0,0.5);
          transition: box-shadow 0.3s ease, transform 0.3s ease;
        }
        .card-glow:hover {
          box-shadow: 0 0 0 1px rgba(0,255,135,0.3), 0 20px 60px rgba(0,255,135,0.08);
          transform: translateY(-4px);
        }

        .grain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 100;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        .hero-grid {
          background-image: linear-gradient(rgba(0,255,135,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,255,135,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .float { animation: float 4s ease-in-out infinite; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.8s ease forwards; }
        .fade-up-2 { animation: fadeUp 0.8s 0.15s ease forwards; opacity: 0; }
        .fade-up-3 { animation: fadeUp 0.8s 0.3s ease forwards; opacity: 0; }
        .fade-up-4 { animation: fadeUp 0.8s 0.45s ease forwards; opacity: 0; }

        .pill {
          background: linear-gradient(135deg, rgba(0,255,135,0.1), rgba(0,255,135,0.05));
          border: 1px solid rgba(0,255,135,0.2);
        }

        .btn-primary {
          background: var(--green);
          color: #000;
          font-weight: 700;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: white;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .btn-primary:hover::after { opacity: 0.1; }
        .btn-primary:hover { transform: scale(1.02); box-shadow: 0 0 30px rgba(0,255,135,0.4); }

        .feature-icon {
          background: linear-gradient(135deg, rgba(0,255,135,0.15), rgba(0,255,135,0.05));
          border: 1px solid rgba(0,255,135,0.2);
        }

        details summary { cursor: pointer; list-style: none; }
        details summary::-webkit-details-marker { display: none; }
        details[open] summary .faq-icon { transform: rotate(45deg); }
        .faq-icon { transition: transform 0.2s ease; }
      `}</style>

      {/* Grain overlay */}
      <div className="grain" />

      {/* ── NAVBAR ─────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1A1F2E] backdrop-blur-xl bg-[#080A0F]/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display text-2xl tracking-wider" style={{ color: "var(--green)" }}>MARCAGOL</span>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition">Funcionalidades</a>
            <a href="#precios" className="hover:text-white transition">Precios</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition px-4 py-2">
              Entrar
            </Link>
            <Link href="/login" className="btn-primary text-sm px-5 py-2.5 rounded-xl">
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────── */}
      <section className="hero-grid min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 relative">
        {/* Glow orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,255,135,0.06) 0%, transparent 70%)" }} />

        <div className="fade-up">
          <span className="pill text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full inline-block mb-8" style={{ color: "var(--green)" }}>
            ⚡ 1 mes gratis — sin tarjeta
          </span>
        </div>

        <h1 className="font-display text-7xl md:text-[10rem] leading-none tracking-wider glow fade-up-2" style={{ color: "var(--green)" }}>
          MARCAGOL
        </h1>
        <p className="text-2xl md:text-3xl font-light text-gray-300 mt-4 fade-up-3 max-w-2xl">
          Gestiona tu liga de fútbol como un profesional.
          <span className="text-white font-medium"> Calendario, resultados, estadísticas y más.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-10 fade-up-4">
          <Link href="/login" className="btn-primary px-8 py-4 rounded-2xl text-base font-bold">
            Crear mi torneo gratis →
          </Link>
          <a href="#features" className="px-8 py-4 rounded-2xl text-base font-medium text-gray-400 hover:text-white border border-[#1A1F2E] hover:border-gray-600 transition">
            Ver funcionalidades
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 fade-up-4">
          {[
            { n: "100%", label: "Gratis el primer mes" },
            { n: "$200", label: "MXN / mes después" },
            { n: "∞", label: "Equipos y jugadores" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-5xl tracking-wider" style={{ color: "var(--green)" }}>{s.n}</p>
              <p className="text-gray-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-32">
        <div className="text-center mb-16">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "var(--green)" }}>Funcionalidades</p>
          <h2 className="font-display text-6xl md:text-7xl tracking-wider text-white">TODO LO QUE</h2>
          <h2 className="font-display text-6xl md:text-7xl tracking-wider" style={{ color: "var(--green)" }}>NECESITAS</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: "📅", title: "Calendario automático", desc: "Genera el fixture completo en segundos. Round-robin, ida y vuelta, días y horarios personalizados." },
            { icon: "⚽", title: "Resultados en vivo", desc: "Carga marcadores, goleadores y asistencias partido a partido. Estadísticas en tiempo real." },
            { icon: "🏆", title: "Tabla de posiciones", desc: "Actualización automática al cargar resultados. Puntos, goles, diferencia — todo calculado al instante." },
            { icon: "👥", title: "Equipos y jugadores", desc: "Registra equipos, jugadores, números y posiciones. Agrega más equipos en cualquier momento." },
            { icon: "💰", title: "Finanzas del torneo", desc: "Lleva el control de cuotas, pagos de árbitros, gastos de cancha y premios. Balance siempre visible." },
            { icon: "🟨", title: "Gestión de árbitros", desc: "Registra árbitros, asígnalos a partidos y lleva su historial y pago por partido." },
            { icon: "🎨", title: "Flyer digital", desc: "Tu torneo tiene su propia página pública con info, equipos inscritos, lugares disponibles y contacto." },
            { icon: "📱", title: "Notificaciones WhatsApp", desc: "Envía el calendario y avisos de partidos directamente al WhatsApp de los capitanes. (Próximamente)" },
            { icon: "🌐", title: "Subdominio propio", desc: "Cada torneo tiene su propio subdominio. Liga-regia.marcagol.com.mx — profesional y fácil de compartir." },
          ].map((f) => (
            <div key={f.title} className="card-glow bg-[#0E1117] rounded-2xl p-6">
              <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4">{f.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRECIOS ────────────────────────────── */}
      <section id="precios" className="max-w-4xl mx-auto px-6 py-32">
        <div className="text-center mb-16">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "var(--green)" }}>Precios</p>
          <h2 className="font-display text-6xl md:text-7xl tracking-wider text-white">SIMPLE Y</h2>
          <h2 className="font-display text-6xl md:text-7xl tracking-wider" style={{ color: "var(--green)" }}>TRANSPARENTE</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan gratis */}
          <div className="card-glow bg-[#0E1117] rounded-2xl p-8">
            <p className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-4">Primer mes</p>
            <p className="font-display text-6xl tracking-wider text-white">GRATIS</p>
            <p className="text-gray-500 text-sm mt-2 mb-8">Sin tarjeta de crédito. Sin compromisos.</p>
            <ul className="space-y-3 mb-8">
              {[
                "Torneos ilimitados",
                "Equipos y jugadores ilimitados",
                "Calendario automático",
                "Resultados y estadísticas",
                "Flyer digital",
                "Subdominio propio",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                  <span style={{ color: "var(--green)" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/login" className="btn-primary w-full py-3 rounded-xl text-center block font-bold">
              Empezar gratis →
            </Link>
          </div>

          {/* Plan pro */}
          <div className="rounded-2xl p-8 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(0,255,135,0.08), rgba(0,255,135,0.02))", border: "1px solid rgba(0,255,135,0.3)" }}>
            <div className="absolute top-4 right-4">
              <span className="pill text-xs font-bold px-3 py-1 rounded-full" style={{ color: "var(--green)" }}>Más popular</span>
            </div>
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--green)" }}>Después del mes gratis</p>
            <div className="flex items-end gap-2">
              <p className="font-display text-6xl tracking-wider text-white">$200</p>
              <p className="text-gray-400 mb-2">MXN / mes</p>
            </div>
            <p className="text-gray-500 text-sm mt-2 mb-8">Todo incluido. Sin sorpresas.</p>
            <ul className="space-y-3 mb-8">
              {[
                "Todo del plan gratis",
                "Finanzas del torneo",
                "Gestión de árbitros",
                "Notificaciones WhatsApp",
                "Soporte prioritario",
                "Acceso a nuevas funciones",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                  <span style={{ color: "var(--green)" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/login" className="btn-primary w-full py-3 rounded-xl text-center block font-bold">
              Empezar gratis →
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-32">
        <div className="text-center mb-16">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "var(--green)" }}>Testimonios</p>
          <h2 className="font-display text-6xl md:text-7xl tracking-wider text-white">LO QUE DICEN</h2>
          <h2 className="font-display text-6xl md:text-7xl tracking-wider" style={{ color: "var(--green)" }}>LOS ADMINS</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "Carlos M.", role: "Organizador Liga Regia", text: "Antes llevaba todo en Excel y WhatsApp. Con Marcagol el calendario se genera solo y los resultados se actualizan al instante. Mis equipos están felices." },
            { name: "Roberto S.", role: "Admin Torneo Norte", text: "El módulo de finanzas me salvó. Ya sé exactamente cuánto entra de cuotas y cuánto se va en árbitros y cancha. Todo en un solo lugar." },
            { name: "Miguel T.", role: "Coordinador Liga 5v5", text: "Los equipos tienen su propio subdominio y flyer. Se ve muy profesional. Ya varios equipos me preguntaron cómo lo hice." },
          ].map((t) => (
            <div key={t.name} className="card-glow bg-[#0E1117] rounded-2xl p-6">
              <p className="text-gray-300 text-sm leading-relaxed mb-6">"{t.text}"</p>
              <div>
                <p className="text-white font-bold text-sm">{t.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────── */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-32">
        <div className="text-center mb-16">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "var(--green)" }}>FAQ</p>
          <h2 className="font-display text-6xl md:text-7xl tracking-wider text-white">PREGUNTAS</h2>
          <h2 className="font-display text-6xl md:text-7xl tracking-wider" style={{ color: "var(--green)" }}>FRECUENTES</h2>
        </div>

        <div className="space-y-3">
          {[
            { q: "¿Necesito tarjeta de crédito para empezar?", a: "No. El primer mes es completamente gratis sin necesidad de ingresar datos de pago." },
            { q: "¿Cuántos equipos puedo agregar?", a: "Ilimitados. No hay restricción en la cantidad de equipos, jugadores o partidos que puedes registrar." },
            { q: "¿Puedo agregar equipos después de generar el calendario?", a: "Sí. Puedes agregar equipos en cualquier momento y regenerar el calendario automáticamente." },
            { q: "¿Cómo funciona el subdominio?", a: "Cada torneo tiene su propio subdominio personalizado. Por ejemplo: mi-liga.marcagol.app. Fácil de compartir con tus equipos." },
            { q: "¿Las notificaciones de WhatsApp están incluidas?", a: "Las notificaciones por WhatsApp estarán disponibles próximamente en el plan de $200/mes." },
            { q: "¿Qué pasa si cancelo?", a: "Puedes cancelar cuando quieras. No hay contratos ni penalizaciones. Tus datos permanecen disponibles por 30 días." },
          ].map((faq) => (
            <details key={faq.q} className="bg-[#0E1117] border border-[#1A1F2E] rounded-2xl overflow-hidden group">
              <summary className="flex items-center justify-between px-6 py-5 text-white font-medium text-sm hover:text-green-400 transition">
                {faq.q}
                <span className="faq-icon text-gray-500 text-xl ml-4 flex-shrink-0">+</span>
              </summary>
              <p className="px-6 pb-5 text-gray-400 text-sm leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-32 text-center">
        <div className="rounded-3xl p-16 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(0,255,135,0.08), rgba(0,255,135,0.02))", border: "1px solid rgba(0,255,135,0.2)" }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center, rgba(0,255,135,0.05) 0%, transparent 70%)" }} />
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--green)" }}>Empieza hoy</p>
          <h2 className="font-display text-6xl md:text-8xl tracking-wider text-white leading-none">TU LIGA</h2>
          <h2 className="font-display text-6xl md:text-8xl tracking-wider leading-none glow" style={{ color: "var(--green)" }}>PROFESIONAL</h2>
          <p className="text-gray-400 mt-6 mb-10 text-lg">1 mes gratis. Sin tarjeta. Sin complicaciones.</p>
          <Link href="/login" className="btn-primary inline-block px-12 py-5 rounded-2xl text-lg font-bold">
            Crear mi torneo gratis →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────── */}
      <footer className="border-t border-[#1A1F2E] max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="font-display text-3xl tracking-wider" style={{ color: "var(--green)" }}>MARCAGOL</span>
            <p className="text-gray-600 text-xs mt-1">Gestión profesional de ligas de fútbol</p>
          </div>
          <div className="flex gap-8 text-sm text-gray-500">
            <a href="#features" className="hover:text-white transition">Funcionalidades</a>
            <a href="#precios" className="hover:text-white transition">Precios</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
            <Link href="/login" className="hover:text-white transition">Entrar</Link>
          </div>
          <p className="text-gray-600 text-xs">© 2026 Marcagol. San Luis Potosí, México.</p>
        </div>
      </footer>

    </div>
  );
}