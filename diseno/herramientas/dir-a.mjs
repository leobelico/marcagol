// Dirección A · Tlachco (jade nocturno). La planta en I de la cancha como símbolo,
// letras de trazo fino y recto, tabla densa con cifras monoespaciadas.
import { LIGA, TABLA, CORTE_LIGUILLA, JORNADA, GOLEADORES, ROLES } from "./datos.mjs";
import { chip, escudo, forma, nombre, marcador, escudoLiga, documento, ICONO } from "./piezas.mjs";

const FUENTES = "family=Archivo:wdth,wght@62..125,500..900";

const pieLiga = (simb) => `<footer class="plataforma">Resultados publicados con <a href="landing.html">${simb}Tlachtli</a></footer>`;

function cabeceraLiga() {
  return `<header class="liga">
  <div class="contenedor liga__in">
    ${escudoLiga(56)}
    <div class="liga__txt">
      <p class="etiqueta liga__meta">${LIGA.torneo} · ${LIGA.categoria}</p>
      <h1>${LIGA.nombre}</h1>
      <p class="liga__sede">${ICONO.pin}${LIGA.sede}</p>
    </div>
    <div class="liga__acciones">
      <a class="btn-liga" href="#">${ICONO.insta}<span>Instagram</span></a>
      <a class="btn-liga" href="#">${ICONO.compartir}<span>Compartir</span></a>
    </div>
  </div>
</header>`;
}

function pestanas(activa) {
  const items = ["Inicio", "Jornada", "Tabla", "Goleo", "Equipos", "Reglamento"];
  return `<nav class="pestanas" aria-label="Secciones de la liga"><div class="contenedor pestanas__in">${items
    .map((t) => `<a href="#"${t === activa ? ' aria-current="page"' : ""}>${t}</a>`)
    .join("")}</div></nav>`;
}

function filaTabla(f, completa) {
  const lider = f.pos === 1 ? `<span class="lider">Líder</span>` : "";
  const dif = f.dif > 0 ? `<span class="dif-mas">+${f.dif}</span>` : f.dif < 0 ? `<span class="dif-menos">${f.dif}</span>` : `${f.dif}`;
  return `<tr class="${f.pos <= CORTE_LIGUILLA ? "zona" : ""}">
    <td class="pos num">${f.pos}</td>
    <th scope="row" class="izq"><span class="equipo">${escudo(f.id)}<span class="nom">${f.nombre}</span>${lider}</span></th>
    <td class="num">${f.pj}</td>
    ${completa ? `<td class="num">${f.g}</td><td class="num">${f.e}</td><td class="num">${f.p}</td><td class="num">${f.gf}</td><td class="num">${f.gc}</td>` : ""}
    <td class="num">${dif}</td>
    <td class="pts num">${f.pts}</td>
    ${completa ? `<td class="izq">${forma(f.forma)}</td>` : ""}
  </tr>${f.pos === CORTE_LIGUILLA ? `<tr class="corte"><td colspan="${completa ? 12 : 5}"><span>Corte de liguilla · pasan 8</span></td></tr>` : ""}`;
}

function tabla(completa) {
  return `<table class="tabla">
  <caption class="sr">Tabla de posiciones de ${LIGA.nombre}, al cierre de la jornada 8</caption>
  <thead><tr>
    <th scope="col"><abbr title="Posición">#</abbr></th><th scope="col" class="izq">Equipo</th><th scope="col"><abbr title="Partidos jugados">PJ</abbr></th>
    ${completa ? `<th scope="col"><abbr title="Ganados">G</abbr></th><th scope="col"><abbr title="Empatados">E</abbr></th><th scope="col"><abbr title="Perdidos">P</abbr></th><th scope="col"><abbr title="Goles a favor">GF</abbr></th><th scope="col"><abbr title="Goles en contra">GC</abbr></th>` : ""}
    <th scope="col"><abbr title="Diferencia de goles">DIF</abbr></th><th scope="col"><abbr title="Puntos">PTS</abbr></th>
    ${completa ? `<th scope="col" class="izq">Últimos 5</th>` : ""}
  </tr></thead>
  <tbody>${TABLA.map((f) => filaTabla(f, completa)).join("")}</tbody>
</table>`;
}

function partido(p) {
  const cancel = p.estado === "cancelado";
  const ganaL = p.estado === "final" && p.gl > p.gv;
  const ganaV = p.estado === "final" && p.gv > p.gl;
  return `<li class="partido partido--${p.estado}">
    <div class="partido__meta"><span class="etiqueta">${p.cancha}</span>${chip(p)}</div>
    <div class="partido__equipos${cancel ? " tachado" : ""}">
      <span class="lado lado--l${ganaV ? " pierde-lado" : ""}"><span>${nombre(p.local)}</span>${escudo(p.local)}</span>
      <span class="marcador num">${marcador(p) || `<span class="vs">vs</span>`}</span>
      <span class="lado${ganaL ? " pierde-lado" : ""}">${escudo(p.visita)}<span>${nombre(p.visita)}</span></span>
    </div>
    ${p.nota ? `<p class="partido__nota">${p.nota}</p>` : p.arbitro ? `<p class="partido__nota">${ICONO.silbato}${p.arbitro}</p>` : ""}
  </li>`;
}

function jornadaLista() {
  return JORNADA.horarios
    .map((h) => `<li class="horario"><p class="horario__hora num">${h}</p><ul class="lista">${JORNADA.partidos.filter((p) => p.hora === h).map(partido).join("")}</ul></li>`)
    .join("");
}

function selectorJornada() {
  return `<nav class="jornadas" aria-label="Elegir jornada">${JORNADA.jornadas
    .map((j) => `<a href="#"${j.actual ? ' aria-current="true"' : ""}><span class="num">J${j.n}</span><small>${j.fecha}</small></a>`)
    .join("")}</nav>`;
}

export function landing({ logo, simb }) {
  const cuerpo = `
<div class="modo-oscuro heroe">
  <svg class="heroe__cancha" viewBox="0 0 600 720" aria-hidden="true"><path d="M60 40H540V200H400V520H540V680H60V520H200V200H60Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M200 360H400" stroke="currentColor" stroke-width="2"/><circle cx="300" cy="360" r="46" fill="none" stroke="currentColor" stroke-width="2"/><path d="M60 120H540M60 600H540" stroke="currentColor" stroke-width="1" stroke-dasharray="4 10"/></svg>
  <header class="contenedor barra">
    <a href="#" class="barra__logo" aria-label="Tlachtli, inicio">${logo("oscuro")}</a>
    <nav class="barra__nav" aria-label="Principal"><a href="#">Funciones</a><a href="#">Para ligas</a><a href="#">Precio</a><a href="#">Entrar</a></nav>
    <a href="#" class="btn btn--acento">Agenda una demo</a>
  </header>
  <section class="contenedor heroe__in">
    <div class="heroe__txt">
      <p class="etiqueta heroe__eti">Gestión de ligas de fútbol amateur</p>
      <h1>Tu liga, en orden cada jornada.</h1>
      <p class="heroe__sub">Calendario, resultados en vivo, tabla y goleo en un solo lugar. Para quien organiza, quien pita, quien capitanea y quien sigue el partido desde el celular.</p>
      <div class="heroe__cta"><a href="#" class="btn btn--acento">Agenda una demo ${ICONO.flecha}</a><a href="liga-movil.html" class="btn btn--linea">Ver una liga de ejemplo</a></div>
      <p class="heroe__prueba"><span class="num">12</span> equipos · <span class="num">48</span> partidos · tabla al minuto</p>
    </div>
    <div class="vista modo-claro" aria-label="Vista previa de la página pública de una liga" role="img">
      <div class="vista__liga">${escudoLiga(36)}<div><p class="etiqueta">${LIGA.torneo}</p><p class="vista__nombre">${LIGA.nombre}</p></div></div>
      <div class="vista__vivo">
        ${chip(JORNADA.partidos[2])}
        <div class="vista__marcador"><span>${escudo("RT")} Real Tangamanga</span><b class="num">1–2</b><span>Club Tequis ${escudo("CT")}</span></div>
      </div>
      <ol class="vista__tabla">${TABLA.slice(0, 5).map((f) => `<li><span class="num">${f.pos}</span>${escudo(f.id)}<span>${f.nombre}</span><b class="num">${f.pts}</b></li>`).join("")}</ol>
    </div>
  </section>
</div>
<main>
  <section class="contenedor roles" aria-labelledby="roles-t">
    <h2 id="roles-t" class="etiqueta">Una cancha, cuatro maneras de vivirla</h2>
    <ul class="roles__lista">${ROLES.map((r, i) => `<li><p class="num roles__n">0${i + 1}</p><h3>${r.rol}</h3><p>${r.texto}</p></li>`).join("")}</ul>
  </section>
  <section class="contenedor protagonista" aria-labelledby="prot-t">
    <div>
      <h2 id="prot-t">La que se luce es tu liga.</h2>
      <p>Tu escudo, tus colores y tu nombre al frente. Tlachtli se queda en el pie de página.</p>
    </div>
    <div class="muestras">
      <div class="muestra" style="--c:#7C1D3A">${escudoLiga(28)}<span>Liga Valle del Sol</span></div>
      <div class="muestra" style="--c:#0F5E63"><span class="muestra__esc">CN</span><span>Copa Barrio Norte</span></div>
      <div class="muestra" style="--c:#1E3A8A"><span class="muestra__esc">TS</span><span>Torneo Sabatino</span></div>
    </div>
  </section>
</main>
<footer class="pie contenedor">
  <span class="pie__logo">${logo("mono")}</span>
  <p>Tlachtli es un producto de <b>KoatlCyber</b>.</p>
  <nav aria-label="Pie"><a href="#">Privacidad</a><a href="#">Contacto</a></nav>
</footer>`;
  return documento({ titulo: "Tlachtli · Dirección A", descripcion: "Portada de la landing, dirección A Tlachco", fuentes: FUENTES, css: "tema.css", cuerpo, claseBody: "landing" });
}

export function tablaJornada({ simb }) {
  const cuerpo = `
${cabeceraLiga()}
${pestanas("Jornada")}
<main class="contenedor pagina">
  <div class="pagina__cab">
    <div><p class="etiqueta suave">Jornada ${JORNADA.numero} · ${JORNADA.fecha}</p><h2 class="titulo">Jornada y tabla</h2></div>
    ${selectorJornada()}
  </div>
  <div class="rejilla">
    <section class="tarjeta col-8" aria-labelledby="t-tabla">
      <div class="tarjeta__cab"><h2 id="t-tabla" class="etiqueta">Tabla de posiciones</h2><p class="suave pequeno">Al cierre de la jornada 8</p></div>
      ${tabla(true)}
      <p class="leyenda"><span class="leyenda__zona" aria-hidden="true"></span>Barra y línea de corte: zona de liguilla. ${forma(["G", "E", "P"])} ganado, empatado, perdido.</p>
    </section>
    <div class="col-4 pila">
      <section class="tarjeta" aria-labelledby="t-jor">
        <div class="tarjeta__cab"><h2 id="t-jor" class="etiqueta">Jornada ${JORNADA.numero}</h2><p class="suave pequeno">${JORNADA.fechaCorta}</p></div>
        <ul class="horarios">${jornadaLista()}</ul>
      </section>
      <section class="tarjeta" aria-labelledby="t-gol">
        <div class="tarjeta__cab"><h2 id="t-gol" class="etiqueta">Goleo</h2></div>
        <ol class="goleo">${GOLEADORES.map((g, i) => `<li><span class="num goleo__n">${i + 1}</span><span class="goleo__j"><b>${g.nombre}</b><small>${nombre(g.equipo)}</small></span><span class="num goleo__g">${g.goles}</span></li>`).join("")}</ol>
      </section>
    </div>
  </div>
</main>
${pieLiga(simb("claro", 16))}`;
  return documento({ titulo: `${LIGA.nombre} · Jornada ${JORNADA.numero}`, descripcion: "Tabla de posiciones y jornada, dirección A", fuentes: FUENTES, css: "tema.css", cuerpo, claseBody: "sitio" });
}

export function ligaMovil({ simb }) {
  const vivo = JORNADA.partidos.find((p) => p.estado === "vivo");
  const cuerpo = `
${cabeceraLiga()}
${pestanas("Inicio")}
<main class="movil">
  <section class="tarjeta vivo" aria-labelledby="m-vivo">
    <div class="tarjeta__cab"><h2 id="m-vivo" class="etiqueta">Ahora en la cancha</h2>${chip(vivo)}</div>
    <div class="vivo__marcador">
      <span class="vivo__eq">${escudo(vivo.local, true)}<b>${nombre(vivo.local)}</b></span>
      <span class="vivo__goles num">${vivo.gl}<span aria-hidden="true">–</span><span class="sr"> a </span>${vivo.gv}</span>
      <span class="vivo__eq">${escudo(vivo.visita, true)}<b>${nombre(vivo.visita)}</b></span>
    </div>
    <p class="suave pequeno centro">${vivo.cancha} · Árbitro: ${vivo.arbitro}</p>
  </section>
  <section class="tarjeta" aria-labelledby="m-jor">
    <div class="tarjeta__cab"><h2 id="m-jor" class="etiqueta">Jornada ${JORNADA.numero}</h2><p class="suave pequeno">${JORNADA.fechaCorta}</p></div>
    <ul class="horarios">${jornadaLista()}</ul>
  </section>
  <section class="tarjeta" aria-labelledby="m-tabla">
    <div class="tarjeta__cab"><h2 id="m-tabla" class="etiqueta">Tabla</h2><a class="mas" href="#">Completa ${ICONO.flecha}</a></div>
    ${tabla(false)}
  </section>
  <section class="tarjeta" aria-labelledby="m-gol">
    <div class="tarjeta__cab"><h2 id="m-gol" class="etiqueta">Goleo</h2></div>
    <ol class="goleo">${GOLEADORES.slice(0, 3).map((g, i) => `<li><span class="num goleo__n">${i + 1}</span><span class="goleo__j"><b>${g.nombre}</b><small>${nombre(g.equipo)}</small></span><span class="num goleo__g">${g.goles}</span></li>`).join("")}</ol>
  </section>
  <section class="organiza"><p class="etiqueta suave">Organiza</p><p><b>${LIGA.organiza}</b> · <a href="#">@ligavalledelsol</a></p></section>
</main>
${pieLiga(simb("claro", 16))}`;
  return documento({ titulo: `${LIGA.nombre} · Inicio`, descripcion: "Página pública de la liga en celular, dirección A", fuentes: FUENTES, css: "tema.css", cuerpo, claseBody: "sitio" });
}
