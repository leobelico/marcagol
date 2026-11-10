// Dirección B · Talud (barro y tinta). Los muros escalonados de la cancha como símbolo,
// letras de bloque condensadas, aire editorial y partidos como boletos.
import { LIGA, TABLA, CORTE_LIGUILLA, JORNADA, GOLEADORES, ROLES } from "./datos.mjs";
import { chip, escudo, forma, nombre, escudoLiga, documento, ICONO } from "./piezas.mjs";

const FUENTES = "family=Big+Shoulders+Display:wght@600;700;800;900";

const escalones = (clase = "") => `<div class="escalones ${clase}" aria-hidden="true"></div>`;
const pieLiga = (simb) => `<footer class="plataforma">Resultados publicados con <a href="landing.html">${simb}Tlachtli</a></footer>`;

function cabeceraLiga() {
  return `<header class="liga contenedor">
  ${escudoLiga(72)}
  <div class="liga__txt">
    <p class="etiqueta liga__meta">${LIGA.torneo} · ${LIGA.categoria}</p>
    <h1>${LIGA.nombre}</h1>
    <p class="liga__sede">${ICONO.pin}${LIGA.sede} · Organiza ${LIGA.organiza}</p>
  </div>
  <div class="liga__acciones"><a class="btn-sec" href="#">${ICONO.insta}<span>Instagram</span></a><a class="btn-sec" href="#">${ICONO.compartir}<span>Compartir</span></a></div>
</header>
${escalones("escalones--liga")}`;
}

function pestanas(activa) {
  const items = ["Inicio", "Jornada", "Tabla", "Goleo", "Equipos", "Reglamento"];
  return `<nav class="pestanas contenedor" aria-label="Secciones de la liga">${items
    .map((t) => `<a href="#"${t === activa ? ' aria-current="page"' : ""}>${t}</a>`)
    .join("")}</nav>`;
}

function boleto(p) {
  const jugado = p.estado === "final" || p.estado === "vivo";
  const cancel = p.estado === "cancelado";
  const fila = (id, g, otro) => {
    const gana = p.estado === "final" && g > otro;
    const pierde = p.estado === "final" && g < otro;
    return `<div class="boleto__fila${gana ? " gana" : ""}${pierde ? " pierde-fila" : ""}">${escudo(id)}<span class="boleto__eq${cancel ? " tachado" : ""}">${nombre(id)}</span><b class="num">${jugado ? g : ""}</b></div>`;
  };
  return `<li class="boleto boleto--${p.estado}">
    <div class="boleto__talon"><span class="boleto__hora">${p.hora}</span><span class="etiqueta">${p.cancha}</span></div>
    <div class="boleto__cuerpo">
      ${fila(p.local, p.gl, p.gv)}
      ${fila(p.visita, p.gv, p.gl)}
      <div class="boleto__pie">${chip(p)}<span>${p.nota ?? (p.arbitro ? `${ICONO.silbato}${p.arbitro}` : "")}</span></div>
    </div>
  </li>`;
}

function tabla(completa) {
  const n = completa ? 10 : 5;
  const filas = TABLA.map((f) => {
    const dif = f.dif > 0 ? `<span class="dif-mas">+${f.dif}</span>` : f.dif < 0 ? `<span class="dif-menos">${f.dif}</span>` : `${f.dif}`;
    return `<tr class="${f.pos <= CORTE_LIGUILLA ? "zona" : ""}${f.pos === 1 ? " primero" : ""}">
      <td class="pos">${String(f.pos).padStart(2, "0")}</td>
      <th scope="row"><span class="equipo">${escudo(f.id)}<span class="nom">${f.nombre}</span></span></th>
      <td class="num">${f.pj}</td>
      ${completa ? `<td class="num">${f.g}</td><td class="num">${f.e}</td><td class="num">${f.p}</td><td class="num">${f.gf}:${f.gc}</td>` : ""}
      <td class="num">${dif}</td>
      <td class="pts">${f.pts}</td>
      ${completa ? `<td class="izq">${forma(f.forma)}</td>` : ""}
    </tr>${f.pos === CORTE_LIGUILLA ? `<tr class="corte"><td colspan="${n}"><span>▲ Liguilla</span><span>Eliminados ▼</span></td></tr>` : ""}`;
  }).join("");
  return `<table class="tabla">
  <caption class="sr">Tabla de posiciones de ${LIGA.nombre}, al cierre de la jornada 8</caption>
  <thead><tr><th scope="col"><abbr title="Posición">Pos</abbr></th><th scope="col" class="izq">Equipo</th><th scope="col"><abbr title="Partidos jugados">PJ</abbr></th>
  ${completa ? `<th scope="col"><abbr title="Ganados">G</abbr></th><th scope="col"><abbr title="Empatados">E</abbr></th><th scope="col"><abbr title="Perdidos">P</abbr></th><th scope="col"><abbr title="Goles a favor y en contra">Goles</abbr></th>` : ""}
  <th scope="col"><abbr title="Diferencia de goles">DIF</abbr></th><th scope="col"><abbr title="Puntos">PTS</abbr></th>${completa ? `<th scope="col" class="izq">Forma</th>` : ""}</tr></thead>
  <tbody>${filas}</tbody>
</table>`;
}

export function landing({ logo, simb }) {
  const cuerpo = `
<header class="barra contenedor">
  <a href="#" class="barra__logo" aria-label="Tlachtli, inicio">${logo("claro")}</a>
  <nav class="barra__nav" aria-label="Principal"><a href="#">Funciones</a><a href="#">Para ligas</a><a href="#">Precio</a><a href="#">Entrar</a></nav>
  <a href="#" class="btn btn--acento">Agenda una demo</a>
</header>
<main>
  <section class="heroe contenedor">
    <div class="heroe__txt">
      <p class="etiqueta heroe__eti">Gestión de ligas de fútbol amateur</p>
      <h1>La cancha es tuya.<span>El papeleo, nuestro.</span></h1>
      <p class="heroe__sub">Calendario, resultados, tabla y goleo de tu liga en un solo lugar. Tú organizas el domingo; la tabla se actualiza sola.</p>
      <div class="heroe__cta"><a href="#" class="btn btn--acento">Agenda una demo ${ICONO.flecha}</a><a href="liga-movil.html" class="btn btn--linea">Ver una liga de ejemplo</a></div>
    </div>
    <div class="telefono" role="img" aria-label="Vista previa de la página de una liga en el celular">
      <div class="telefono__pantalla">
        <div class="tel__liga">${escudoLiga(30)}<p>${LIGA.nombre}</p></div>
        <ul class="tel__lista">${JORNADA.partidos.slice(0, 4).map(boleto).join("")}</ul>
      </div>
    </div>
  </section>
  ${escalones()}
  <section class="domingo contenedor" aria-labelledby="dom-t">
    <h2 id="dom-t">Un domingo con Tlachtli</h2>
    <ol class="domingo__lista">${ROLES.map((r, i) => `<li><span class="domingo__n">0${i + 1}</span><div><h3>${r.rol}</h3><p>${r.texto}</p></div></li>`).join("")}</ol>
  </section>
  <section class="cita contenedor">
    <p>Tu liga va al frente: tu escudo, tus colores, tu nombre. Nosotros firmamos abajo, en chiquito.</p>
  </section>
</main>
<footer class="pie contenedor">
  <span class="pie__logo">${logo("mono")}</span>
  <p>Un producto de <b>KoatlCyber</b></p>
  <nav aria-label="Pie"><a href="#">Privacidad</a><a href="#">Contacto</a></nav>
</footer>`;
  return documento({ titulo: "Tlachtli · Dirección B", descripcion: "Portada de la landing, dirección B Talud", fuentes: FUENTES, css: "tema.css", cuerpo, claseBody: "landing" });
}

export function tablaJornada({ simb }) {
  const cuerpo = `
${cabeceraLiga()}
${pestanas("Jornada")}
<main class="contenedor pagina">
  <section aria-labelledby="t-jor" class="bloque">
    <div class="bloque__cab">
      <h2 id="t-jor" class="gigante">Jornada <span>${String(JORNADA.numero).padStart(2, "0")}</span></h2>
      <div class="bloque__der">
        <p class="etiqueta">${JORNADA.fecha}</p>
        <nav class="jornadas" aria-label="Elegir jornada">${JORNADA.jornadas.map((j) => `<a href="#"${j.actual ? ' aria-current="true"' : ""}>J${j.n}<small>${j.fecha}</small></a>`).join("")}</nav>
      </div>
    </div>
    <ul class="boletos">${JORNADA.partidos.map(boleto).join("")}</ul>
  </section>
  <div class="dos">
    <section aria-labelledby="t-tabla" class="bloque">
      <div class="bloque__cab bloque__cab--chica"><h2 id="t-tabla" class="mediano">Tabla</h2><p class="etiqueta suave">Al cierre de la jornada 8</p></div>
      <div class="hoja">${tabla(true)}</div>
    </section>
    <section aria-labelledby="t-gol" class="bloque">
      <div class="bloque__cab bloque__cab--chica"><h2 id="t-gol" class="mediano">Goleo</h2></div>
      <ol class="goleo">${GOLEADORES.map((g, i) => `<li><span class="goleo__g">${g.goles}</span><span><b>${g.nombre}</b><small>${nombre(g.equipo)}</small></span></li>`).join("")}</ol>
    </section>
  </div>
</main>
${pieLiga(simb("claro", 14))}`;
  return documento({ titulo: `${LIGA.nombre} · Jornada ${JORNADA.numero}`, descripcion: "Tabla de posiciones y jornada, dirección B", fuentes: FUENTES, css: "tema.css", cuerpo, claseBody: "sitio" });
}

export function ligaMovil({ simb }) {
  const vivo = JORNADA.partidos.find((p) => p.estado === "vivo");
  const cuerpo = `
${cabeceraLiga()}
${pestanas("Inicio")}
<main class="movil">
  <section class="vivo" aria-labelledby="m-vivo">
    <div class="vivo__cab"><h2 id="m-vivo" class="etiqueta">Ahora · ${vivo.cancha}</h2>${chip(vivo)}</div>
    <div class="vivo__fila">${escudo(vivo.local, true)}<span>${nombre(vivo.local)}</span><b>${vivo.gl}</b></div>
    <div class="vivo__fila">${escudo(vivo.visita, true)}<span>${nombre(vivo.visita)}</span><b>${vivo.gv}</b></div>
  </section>
  <section aria-labelledby="m-jor">
    <div class="bloque__cab bloque__cab--chica"><h2 id="m-jor" class="mediano">Jornada ${String(JORNADA.numero).padStart(2, "0")}</h2><p class="etiqueta suave">${JORNADA.fechaCorta}</p></div>
    <ul class="boletos">${JORNADA.partidos.filter((p) => p.estado !== "vivo").map(boleto).join("")}</ul>
  </section>
  <section aria-labelledby="m-tabla">
    <div class="bloque__cab bloque__cab--chica"><h2 id="m-tabla" class="mediano">Tabla</h2><a class="mas" href="#">Completa ${ICONO.flecha}</a></div>
    <div class="hoja">${tabla(false)}</div>
  </section>
  <section aria-labelledby="m-gol">
    <div class="bloque__cab bloque__cab--chica"><h2 id="m-gol" class="mediano">Goleo</h2></div>
    <ol class="goleo">${GOLEADORES.slice(0, 3).map((g) => `<li><span class="goleo__g">${g.goles}</span><span><b>${g.nombre}</b><small>${nombre(g.equipo)}</small></span></li>`).join("")}</ol>
  </section>
</main>
${pieLiga(simb("claro", 14))}`;
  return documento({ titulo: `${LIGA.nombre} · Inicio`, descripcion: "Página pública de la liga en celular, dirección B", fuentes: FUENTES, css: "tema.css", cuerpo, claseBody: "sitio" });
}
