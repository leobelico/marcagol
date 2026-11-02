// Botón de tema flotante para el panel y el sitio público.
// En la página principal de MarcaGol (marcada con data-landing) se oculta
// por CSS, porque ahí el botón va en el menú (ver globals.css).
import ThemeToggle from "./ThemeToggle";

export default function FloatingThemeToggle() {
  return (
    <div
      className="mg-floating-toggle fixed z-40"
      style={{
        left: "max(14px, env(safe-area-inset-left, 0px))",
        bottom: "max(14px, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <ThemeToggle className="shadow-lg" />
    </div>
  );
}
