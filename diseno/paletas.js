// Paletas de las tres direcciones. La usan index.html (para mostrar los
// contrastes) y herramientas/contraste.mjs (para verificarlos).
var PALETAS = {
  A: {
    nombre: "Tlachco",
    lema: "Jade nocturno",
    fuentes: { display: "Archivo", texto: "Manrope", datos: "JetBrains Mono" },
    usos: {
      fondo: "Fondo de página",
      superficie: "Tarjetas, tabla",
      texto: "Texto principal, marcadores",
      suave: "Texto secundario, encabezados de tabla",
      borde: "Divisores (decorativo)",
      acento: "Enlaces, pestaña activa, victorias",
      sobreAcento: "Texto sobre botón de acento",
      realce: "Pelota del logo, líder, fondos de chip",
      sobreRealce: "Texto sobre realce",
      vivo: "Fondo del chip «En vivo»",
      sobreVivo: "Texto del chip «En vivo»",
      cancelado: "Partido cancelado",
      pierde: "Derrotas, diferencia negativa",
    },
    claro: {
      fondo: "#F4F2EC", superficie: "#FFFFFF", texto: "#10201A", suave: "#4D5B55", borde: "#D9D5CA",
      acento: "#0A7350", sobreAcento: "#FFFFFF", realce: "#E8B931", sobreRealce: "#10201A",
      vivo: "#B42318", sobreVivo: "#FFFFFF", cancelado: "#8A4400", pierde: "#B42318",
    },
    oscuro: {
      fondo: "#0B1411", superficie: "#13201B", texto: "#E9EEE9", suave: "#9DAAA3", borde: "#26372F",
      acento: "#3CCB8F", sobreAcento: "#062016", realce: "#F0C64A", sobreRealce: "#10201A",
      vivo: "#FF7A6B", sobreVivo: "#1A0503", cancelado: "#E8A65A", pierde: "#FF8A7D",
    },
  },
  B: {
    nombre: "Talud",
    lema: "Barro y tinta",
    fuentes: { display: "Big Shoulders Display", texto: "Manrope", datos: "JetBrains Mono" },
    usos: {
      fondo: "Fondo de página (papel)",
      superficie: "Tarjetas, boletos de partido",
      texto: "Texto principal, chip «En vivo»",
      suave: "Texto secundario",
      borde: "Divisores (decorativo)",
      acento: "Enlaces, botón principal, escalones",
      sobreAcento: "Texto sobre botón de acento",
      realce: "Fondos de chip, líder",
      sobreRealce: "Texto sobre realce",
      vivo: "Fondo del chip «En vivo» (tinta)",
      sobreVivo: "Texto del chip «En vivo»",
      cancelado: "Partido cancelado",
      pierde: "Derrotas, diferencia negativa",
    },
    claro: {
      fondo: "#F7F0E6", superficie: "#FFFCF7", texto: "#1F1A17", suave: "#5C524B", borde: "#E2D5C3",
      acento: "#A93F17", sobreAcento: "#FFFFFF", realce: "#F1C27D", sobreRealce: "#1F1A17",
      vivo: "#1F1A17", sobreVivo: "#FFFCF7", cancelado: "#7A5A00", pierde: "#A3261E",
    },
    oscuro: {
      fondo: "#17120F", superficie: "#221B17", texto: "#F6EEE4", suave: "#B8AB9C", borde: "#3B3029",
      acento: "#F2885A", sobreAcento: "#1F1A17", realce: "#E9B66C", sobreRealce: "#1F1A17",
      vivo: "#F6EEE4", sobreVivo: "#17120F", cancelado: "#E2BE55", pierde: "#FF8F80",
    },
  },
  C: {
    nombre: "Rebote",
    lema: "Cobalto y maíz",
    fuentes: { display: "Space Grotesk", texto: "Manrope", datos: "JetBrains Mono" },
    usos: {
      fondo: "Fondo de página",
      superficie: "Tarjetas",
      texto: "Texto principal",
      suave: "Texto secundario",
      borde: "Divisores (decorativo)",
      acento: "Enlaces, botón principal, barras de puntos",
      sobreAcento: "Texto sobre botón de acento",
      realce: "Pelota, chips destacados (maíz)",
      sobreRealce: "Texto sobre realce",
      vivo: "Fondo del chip «En vivo»",
      sobreVivo: "Texto del chip «En vivo»",
      cancelado: "Partido cancelado",
      pierde: "Derrotas, diferencia negativa",
    },
    claro: {
      fondo: "#F2F4FA", superficie: "#FFFFFF", texto: "#0B1233", suave: "#4A5378", borde: "#D6DBEA",
      acento: "#2638C9", sobreAcento: "#FFFFFF", realce: "#C6EE3A", sobreRealce: "#0B1233",
      vivo: "#C21F4A", sobreVivo: "#FFFFFF", cancelado: "#8A4B00", pierde: "#C21F4A",
    },
    oscuro: {
      fondo: "#080C22", superficie: "#10173A", texto: "#EEF1FF", suave: "#A0A9CF", borde: "#263063",
      acento: "#8C99FF", sobreAcento: "#0B1233", realce: "#D4F54A", sobreRealce: "#0B1233",
      vivo: "#FF6F91", sobreVivo: "#2A0611", cancelado: "#F0B060", pierde: "#FF8FA8",
    },
  },
};

// Pares de texto que deben cumplir AA (4.5:1) en cada modo.
var PARES = [
  ["texto", "fondo"], ["texto", "superficie"],
  ["suave", "fondo"], ["suave", "superficie"],
  ["acento", "fondo"], ["acento", "superficie"],
  ["sobreAcento", "acento"], ["sobreRealce", "realce"],
  ["sobreVivo", "vivo"], ["cancelado", "superficie"], ["pierde", "superficie"],
];

// Colores de la liga de ejemplo (los pone cada liga, no la plataforma).
// tinta: el color de la liga usado como texto. En modo oscuro la plataforma
// aclara el color de la liga hasta que pase AA (aquí, tintaOscuro).
var LIGA_COLORES = { color: "#7C1D3A", colorTexto: "#FFFFFF", acento: "#F2B705", tintaOscuro: "#F4A7BD" };

if (typeof module !== "undefined") module.exports = { PALETAS, PARES, LIGA_COLORES };
