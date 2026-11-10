// Dirección C · Rebote (cobalto y maíz). La pelota entre los muros como símbolo,
// letras redondas, tarjetas suaves y la jornada como calendario (horario × cancha).
import { LIGA, TABLA, CORTE_LIGUILLA, JORNADA, GOLEADORES, ROLES } from "./datos.mjs";
import { chip, escudo, forma, nombre, escudoLiga, documento, ICONO } from "./piezas.mjs";

const FUENTES = "family=Space+Grotesk:wght@500;600;700";
const MAX = Math.max(...TABLA.map((f) => f.pts));

const pieLiga = (simb) => `<footer class="plataforma">Resultados publicados con <a href="landing.html">${simb}Tlachtli</a></footer>`;

function cabeceraLiga() {
  return `<header class="contenedor">
  <div class="liga">
    <span class="liga__esc">${escudoLiga(52)}</span>
    <div class="liga__txt">
      <h1>${LIGA.nombre}</h1>
      <p>${LIGA.torneo} · ${LIGA.categoria}</p>
    </div>
    <div class="liga__acciones"><a class="btn-liga" href="#" aria-label="Instagram de la liga">${ICONO.insta}</a><a class="btn-liga" href="#">${ICONO.compartir}<span>Compartir</span></a></div>
  </div>
</header>`;
}

function pestanas(activa) {
  const items = ["Inicio", "Jornada", "Tabla", "Goleo", "Equipos", "Reglamento"];
  return `<nav class="contenedor" aria-label="Secciones de la liga"><div class="pestanas">${items
    .map((t) => `<a href="#"${t === activa ? ' aria-current="page"' : ""}>${t}</a>`)
    .join("")}</div></nav>`;
}

function tarjetaPartido(p, conCancha = false) {
  const jugado = p.estado === "final" || p.estado === "vivo";
  const cancel = p.estado === "cancelado";
  const fila = (id, g, otro) => {
    const pierde = p.estado === "final" && g < otro;
    return `<div class="tp__fila${pierde ? " pierde-fila" : ""}">${escudo(id)}<span class="tp__eq${cancel ? " tachado" : ""}">${nombre(id)}</span><b class="num">${jugado ? g : ""}</b></div>`;
  };
  return `<article class="tp tp--${p.estado}">
    <div class="tp__cab">${chip(p)}<span class="tp__hora num">${conCancha ? `${p.hora} · ${p.cancha}` : p.hora}</span></div>
    ${fila(p.local, p.gl, p.gv)}
    ${fila(p.visita, p.gv, p.gl)}
    ${p.nota ? `<p class="tp__nota">${p.nota}</p>` : ""}
  </article>`;
}

function calendario() {
  const celdas = JORNADA.horarios.map((h) => `
    <div class="cal__hora num" role="rowheader">${h}</div>
    ${JORNADA.canchas.map((c) => {
      const p = JORNADA.partidos.find((x) => x.hora === h && x.cancha === c);
      return `<div class="cal__celda" role="cell">${p ? tarjetaPartido(p, true) : ""}</div>`;
    }).join("")}`).join("");
  return `<div class="cal" role="table" aria-label="Partidos de la jornada ${JORNADA.numero} por horario y cancha">
    <div class="cal__esq" role="columnheader"><span class="sr">Horario</span></div>
    ${JORNADA.canchas.map((c) => `<div class="cal__cancha etiqueta" role="columnheader">${c}</div>`).join("")}
    ${celdas}
  </div>`;
}

function tabla(completa) {
  const n = completa ? 11 : 4;
  const filas = TABLA.map((f) => {
    const dif = f.dif > 0 ? `<span class="dif-mas">+${f.dif}</span>` : f.dif < 0 ? `<span class="dif-menos">${f.dif}</span>` : `${f.dif}`;
    return `<tr class="${f.pos <= CORTE_LIGUILLA ? "zona" : ""}">
      <td class="pos"><span class="num">${f.pos}</span></td>
      <th scope="row"><span class="equipo">${escudo(f.id)}<span class="nom">${f.nombre}</span></span></th>
      ${completa ? `<td class="num">${f.pj}</td><td class="num">${f.g}</td><td class="num">${f.e}</td><td class="num">${f.p}</td><td class="num">${f.gf}</td><td class="num">${f.gc}</td>` : ""}
      <td class="num">${dif}</td>
      <td class="pts"><span class="barra-pts" style="--p:${((f.pts / MAX) * 100).toFixed(0)}%"><b class="num">${f.pts}</b></span></td>
      ${completa ? `<td class="izq">${forma(f.forma)}</td>` : ""}
    </tr>${f.pos === CORTE_LIGUILLA ? `<tr class="corte"><td colspan="${n}"><span>Hasta aquí, a liguilla</span></td></tr>` : ""}`;
  }).join("");
  return `<table class="tabla">
  <caption class="sr">Tabla de posiciones de ${LIGA.nombre}, al cierre de la jornada 8</caption>
  <thead><tr><th scope="col"><abbr title="Posición">#</abbr></th><th scope="col" class="izq">Equipo</th>
  ${completa ? `<th scope="col"><abbr title="Partidos jugados">PJ</abbr></th><th scope="col"><abbr title="Ganados">G</abbr></th><th scope="col"><abbr title="Empatados">E</abbr></th><th scope="col"><abbr title="Perdidos">P</abbr></th><th scope="col"><abbr title="Goles a favor">GF</abbr></th><th scope="col"><abbr title="Goles en contra">GC</abbr></th>` : ""}
  <th scope="col"><abbr title="Diferencia de goles">DIF</abbr></th><th scope="col" class="izq"><abbr title="Puntos">Puntos</abbr></th>${completa ? `<th scope="col" class="izq">Últimos 5</th>` : ""}</tr></thead>
  <tbody>${filas}</tbody>
</table>`;
}

const goleo = (lista) => `<ol class="goleo">${lista.map((g, i) => `<li><span class="goleo__pos num">${i + 1}</span>${escudo(g.equipo)}<span class="goleo__j"><b>${g.nombre}</b><small>${nombre(g.equipo)}</small></span><span class="goleo__g num">${g.goles}<small>goles</small></span></li>`).join("")}</ol>`;

export function landing({ logo, simb }) {
  const p = JORNADA.partidos;
  const cuerpo = `
<div class="heroe">
  <header class="contenedor barra">
    <a href="#" class="barra__logo" aria-label="Tlachtli, inicio">${logo("oscuro")}</a>
    <nav class="barra__nav" aria-label="Principal"><a href="#">Funciones</a><a href="#">Para ligas</a><a href="#">Precio</a><a href="#">Entrar</a></nav>
    <a href="#" class="btn btn--blanco">Agenda una demo</a>
  </header>
  <section class="contenedor heroe__in">
    <p class="etiqueta heroe__eti">Gestión de ligas de fútbol amateur</p>
    <h1>Cada gol cuenta. <mark>Y se cuenta solo.</mark></h1>
    <p class="heroe__sub">El árbitro lo captura en la cancha y en ese momento cambian el marcador, la tabla y el goleo de tu liga.</p>
    <div class="heroe__cta"><a href="#" class="btn btn--maiz">Agenda una demo ${ICONO.flecha}</a><a href="liga-movil.html" class="btn btn--linea">Ver una liga de ejemplo</a></div>
  </section>
  <svg class="heroe__rebote" viewBox="0 0 1280 160" preserveAspectRatio="none" aria-hidden="true"><path d="M-20 150 Q 200 -40 420 120 T 860 110 T 1300 40" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="2 12" stroke-linecap="round"/></svg>
</div>
<main>
  <section class="contenedor marcadores" aria-label="Ejemplo de una jornada">
    ${tarjetaPartido(p[2], true)}${tarjetaPartido(p[0], true)}${tarjetaPartido(p[3], true)}
  </section>
  <section class="contenedor roles" aria-labelledby="roles-t">
    <h2 id="roles-t">Hecho para todos los que pisan la cancha</h2>
    <ul class="roles__lista">${ROLES.map((r, i) => `<li><span class="roles__bola num" aria-hidden="true">${i + 1}</span><h3>${r.rol}</h3><p>${r.texto}</p></li>`).join("")}</ul>
  </section>
  <section class="contenedor franja">
    <div><h2>Tu liga, con su escudo y sus colores.</h2><p>Cada liga tiene su página pública con su identidad. Tlachtli solo firma al pie.</p></div>
    <a href="tabla-jornada.html" class="btn btn--acento">Ver la página de una liga ${ICONO.flecha}</a>
  </section>
</main>
<footer class="pie contenedor">
  <span class="pie__logo">${logo("mono")}</span>
  <p>Un producto de <b>KoatlCyber</b></p>
  <nav aria-label="Pie"><a href="#">Privacidad</a><a href="#">Contacto</a></nav>
</footer>`;
  return documento({ titulo: "Tlachtli · Dirección C", descripcion: "Portada de la landing, dirección C Rebote", fuentes: FUENTES, css: "tema.css", cuerpo, claseBody: "landing" });
}

export function tablaJornada({ simb }) {
  const cuerpo = `
${cabeceraLiga()}
${pestanas("Jornada")}
<main class="contenedor pagina">
  <section class="panel" aria-labelledby="t-jor">
    <div class="panel__cab">
      <div><h2 id="t-jor">Jornada ${JORNADA.numero}</h2><p class="suave">${JORNADA.fecha} · ${LIGA.sede}</p></div>
      <nav class="jornadas" aria-label="Elegir jornada">${JORNADA.jornadas.map((j) => `<a href="#"${j.actual ? ' aria-current="true"' : ""}><b>${j.n}</b><small>${j.fecha}</small></a>`).join("")}</nav>
    </div>
    ${calendario()}
  </section>
  <div class="rejilla abajo">
    <section class="panel col-8" aria-labelledby="t-tabla">
      <div class="panel__cab"><h2 id="t-tabla">Tabla de posiciones</h2><p class="suave">Al cierre de la jornada 8</p></div>
      <div class="desliza">${tabla(true)}</div>
    </section>
    <section class="panel col-4" aria-labelledby="t-gol">
      <div class="panel__cab"><h2 id="t-gol">Goleo</h2></div>
      ${goleo(GOLEADORES)}
    </section>
  </div>
</main>
${pieLiga(simb("claro", 16))}`;
  return documento({ titulo: `${LIGA.nombre} · Jornada ${JORNADA.numero}`, descripcion: "Tabla de posiciones y jornada, dirección C", fuentes: FUENTES, css: "tema.css", cuerpo, claseBody: "sitio" });
}

export function ligaMovil({ simb }) {
  const vivo = JORNADA.partidos.find((p) => p.estado === "vivo");
  const cuerpo = `
${cabeceraLiga()}
${pestanas("Inicio")}
<main class="movil">
  <section class="vivo" aria-labelledby="m-vivo">
    <div class="vivo__cab"><h2 id="m-vivo" class="etiqueta">${vivo.cancha} · Jornada ${JORNADA.numero}</h2>${chip(vivo)}</div>
    <div class="vivo__marcador">
      <span class="vivo__eq">${escudo(vivo.local, true)}<b>${nombre(vivo.local)}</b></span>
      <span class="vivo__goles num">${vivo.gl}<span aria-hidden="true">:</span><span class="sr"> a </span>${vivo.gv}</span>
      <span class="vivo__eq">${escudo(vivo.visita, true)}<b>${nombre(vivo.visita)}</b></span>
    </div>
    <p class="vivo__ultimo">Último gol: Saúl Infante · 58'</p>
  </section>
  <section aria-labelledby="m-jor">
    <div class="sec__cab"><h2 id="m-jor">Jornada ${JORNADA.numero}</h2><p class="suave">${JORNADA.fechaCorta}</p></div>
    <div class="carrusel" tabindex="0" aria-label="Partidos de la jornada, desliza para ver más">${JORNADA.partidos.filter((p) => p.estado !== "vivo").map((p) => tarjetaPartido(p, true)).join("")}</div>
  </section>
  <section class="panel" aria-labelledby="m-tabla">
    <div class="panel__cab"><h2 id="m-tabla">Tabla</h2><a class="mas" href="#">Completa ${ICONO.flecha}</a></div>
    ${tabla(false)}
  </section>
  <section class="panel" aria-labelledby="m-gol">
    <div class="panel__cab"><h2 id="m-gol">Goleo</h2></div>
    ${goleo(GOLEADORES.slice(0, 3))}
  </section>
  <p class="organiza suave">Organiza <b>${LIGA.organiza}</b> · <a href="#">@ligavalledelsol</a></p>
</main>
${pieLiga(simb("claro", 16))}`;
  return documento({ titulo: `${LIGA.nombre} · Inicio`, descripcion: "Página pública de la liga en celular, dirección C", fuentes: FUENTES, css: "tema.css", cuerpo, claseBody: "sitio" });
}
