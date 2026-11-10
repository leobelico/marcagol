# Supuestos

Propuestas visuales para Tlachtli. No se tocó `src/`, `prisma/`, `tests/` ni nada del despliegue; todo vive en `/diseno`.

## Marca y familia

- **KoatlCyber no tiene una guía de marca en el repositorio.** Por eso definí una base de familia en `compartido/familia.css` que comparten las tres direcciones:
  - Texto en Manrope y datos/etiquetas en JetBrains Mono. La mono le da el lado «cyber» a la familia.
  - Rejilla de 12 columnas, contenedor de 1200 px, medianil de 24 px (16 px en celular) y espaciado de 8 en 8.
  - Radio de 10 px y etiquetas en mayúsculas monoespaciadas.
  - Tono directo, de «tú».

  Cada dirección pone encima su fuente de títulos, su paleta y su símbolo. Si KoatlCyber ya tiene fuentes o rejilla, se cambian en ese archivo y en `paletas.js`.
- **El nombre se escribe «Tlachtli»**, con mayúscula inicial en texto corrido. Las direcciones A y C lo dibujan en minúsculas y la B en mayúsculas.
- **Los logotipos están construidos a mano con trazos geométricos.** No son una fuente tipográfica, así que no dependen de ninguna fuente instalada ni tienen problemas de licencia. Se generan en `herramientas/logos.mjs`.
- **La inspiración náhuatl se limita a la cancha y la pelota:**
  - A: la planta en I de la cancha.
  - B: los muros escalonados en corte.
  - C: el rebote de la pelota entre los muros.

  No usé deidades, glifos calendáricos, grecas ni símbolos rituales. Evité a propósito el signo *ollin* y cualquier tocado o figura humana.
- **No verifiqué si «Tlachtli» está libre como marca.** Antes de adoptar el nombre conviene buscarlo en el IMPI, en las clases 9, 41 y 42, igual que se revisó con MarcaGol.
- **Los archivos de logotipo de cada carpeta son cuatro:**
  - `logo-principal.svg`: a color, para fondo claro.
  - `logo-mono.svg`: una sola tinta.
  - `logo-oscuro.svg`: incluye su fondo oscuro, para que se vea al abrirlo solo.
  - `icono.svg`: cuadrado de 512, sirve para favicon e ícono de app.

## Contenido

- **Todos los datos son inventados y los comparten las tres direcciones:** «Liga Valle del Sol», 12 equipos, jornada 9 y goleadores. Así se compara el sistema y no el contenido. El escudo de la liga también es inventado.
- **La tabla se muestra «al cierre de la jornada 8».** Los partidos de la jornada 9 que ya terminaron o están en vivo todavía no suman, igual que hoy en la app, donde solo cuentan los partidos con estado FINISHED.
- **La liguilla la juegan los 8 primeros** (supuesto).
- **Las pantallas parten de las reales:**
  - `src/app/sitio/page.tsx`: tabla con PJ, G, E, P, GF, GC, DIF y PTS; resultados; próximos partidos.
  - `src/app/sitio/SitioNav.tsx`: pestañas deslizables en el celular.
  - `src/app/sitio/calendario/page.tsx`: estados SCHEDULED, LIVE, FINISHED y CANCELLED, y árbitro.
  - `src/app/sitio/rol-semanal/page.tsx`: partidos agrupados por jornada, con cancha.
  - `src/app/page.tsx`: la landing.

  Agregué tres cosas que hoy no existen y que propongo: la forma reciente de cada equipo (últimos 5), la línea de corte de liguilla y el selector de jornada.
- **«Portada de la landing» lo tomé como** el primer pantallazo (encabezado y héroe) más dos secciones y el pie. No es la landing completa.
- **«Tabla y jornada en escritorio» es la página pública de la liga** vista en computadora, no el panel de administración.

## Identidad de la liga

- **Cada liga trae su color principal y uno secundario**; en el ejemplo, vino `#7C1D3A` y oro `#F2B705`. Con ellos se pintan la cabecera, la pestaña activa y la marca de la zona de liguilla. El acento de la plataforma solo aparece en controles y en el pie.
- **En modo oscuro, el color de la liga usado como texto se aclara** hasta pasar AA. En el ejemplo queda `#F4A7BD` (token `--liga-tinta`). En producción la plataforma tendría que calcularlo para cada liga.
- **El texto sobre el color de la liga es blanco** porque el vino lo permite. Para ligas con colores claros, la plataforma tendría que cambiar a tinta oscura.

## Accesibilidad

- **Todos los pares de texto se exigen a 4.5:1**, incluso los grandes. `herramientas/contraste.mjs` lo verifica y escribe `CONTRASTE.md`.
- **Los estados de partido se distinguen sin color:**
  - En vivo: píldora rellena con punto.
  - Final: borde continuo con palomita.
  - Por jugar: borde punteado con reloj.
  - Cancelado: equipos tachados y círculo con diagonal.

  Cada estado lleva además su texto.
- **La forma reciente se escribe con letras** (G, E, P) dentro de figuras distintas: cuadro relleno, cuadro con borde y círculo.
- **Las áreas táctiles del celular miden 44 px o más.** La animación del punto «en vivo» se apaga si el sistema pide menos movimiento.

## Capturas y herramientas

- **Capturas en `capturas/`** a escala 2×, página completa:
  - Landing y tabla-jornada a 1280 y a 390 px, para revisar que respondan bien.
  - Página de la liga a 390 px en modo claro y en modo oscuro.
  - La página de la liga está pensada para el celular; su equivalente en escritorio es tabla-jornada.
- **Las capturas se tomaron con Playwright 1.56 instalado fuera del proyecto.** No se agregó a `package.json`. Para regenerarlas: `PW_DIR=<carpeta con node_modules/playwright> node diseno/herramientas/capturar.mjs`.
- **Las fuentes se cargan de Google Fonts**, así que las pantallas necesitan internet para verse con su tipografía.
- **`tokens.css` se genera desde `paletas.js`.** Si cambias un color, cambia `paletas.js` y corre `node diseno/herramientas/construir.mjs`.

## Talud en tres paletas

- **Las variantes `b1-rotulado`, `b2-llano` y `b3-reflector` solo cambian el color.** Tipografía, rejilla, escalones, logotipo y pantallas son los de Talud. Se generan con `node diseno/herramientas/talud-colores.mjs`, que copia `b-talud/tema.css` y verifica AA en claro y oscuro. La comparación está en `talud-colores.html`.
- **Dejé el papel crema con terracota fuera a propósito.** Esa combinación es hoy muy común en marcas digitales y se confunde con otras. Las tres variantes usan fondos fríos o neutros.
- **Escalones y sombras duras usan dos tokens nuevos, `--escalon` y `--sombra`.** Son decorativos y no llevan texto, así que pueden ir en el color de realce (canario, amarillo tarjeta o ámbar), que no pasaría AA como texto.
