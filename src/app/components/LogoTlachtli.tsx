// Logotipo de Tlachtli (dirección Talud, paleta Llano). Los muros escalonados
// toman el acento del tema y la pelota y las letras el color del texto, así
// funciona en claro y oscuro. Fuente: diseno/b2-llano/logo-principal.svg.

const MUROS = (
  <>
    <path d="M104 392V152H156V236H208V392Z" />
    <path d="M408 392V152H356V236H304V392Z" />
  </>
);

/** Logotipo completo: símbolo + «TLACHTLI». */
export default function LogoTlachtli({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 426.27 108" role="img" aria-label="Tlachtli" className={className}>
      <g transform="translate(4 4) scale(0.41) translate(-104 -150)">
        <g fill="var(--mg-accent)">{MUROS}</g>
        <circle cx="256" cy="200" r="38" fill="currentColor" />
      </g>
      <g transform="translate(154.59 26) scale(0.56)" fill="currentColor">
        <path d="M0 9L9 9L9 0L60 0L60 22L41 22L41 100L19 100L19 22L0 22ZM70 9L79 9L79 0L92 0L92 78L116 78L116 100L70 100ZM126 9L135 9L135 0L186 0L186 100L164 100L164 62L148 62L148 100L126 100ZM148 22L164 22L164 42L148 42ZM196 9L205 9L205 0L250 0L250 22L218 22L218 78L250 78L250 100L196 100ZM260 9L269 9L269 0L282 0L282 39L298 39L298 0L320 0L320 100L298 100L298 61L282 61L282 100L260 100ZM330 9L339 9L339 0L390 0L390 22L371 22L371 100L349 100L349 22L330 22ZM400 9L409 9L409 0L422 0L422 78L446 78L446 100L400 100ZM456 9L465 9L465 0L478 0L478 100L456 100Z" />
      </g>
    </svg>
  );
}

/** Solo el símbolo (muros y pelota), para espacios chicos. */
export function SimboloTlachtli({ className = "h-4 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="100 148 312 248" aria-hidden="true" className={className}>
      <g fill="var(--mg-accent)">{MUROS}</g>
      <circle cx="256" cy="200" r="38" fill="currentColor" />
    </svg>
  );
}
