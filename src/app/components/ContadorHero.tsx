"use client";

// Número que cuenta hacia arriba al cargar la portada. El HTML del
// servidor ya trae el valor final, así que sin JS se ve completo.
import { useEffect, useRef } from "react";

export default function ContadorHero({
  valor,
  prefijo = "",
  retraso = 450,
}: {
  valor: number;
  prefijo?: string;
  retraso?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let inicio = 0;
    el.textContent = `${prefijo}0`;
    const paso = (t: number) => {
      if (!inicio) inicio = t;
      const p = Math.min(1, (t - inicio) / 1100);
      el.textContent = `${prefijo}${Math.round(valor * (1 - Math.pow(1 - p, 3)))}`;
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    const id = setTimeout(() => (raf = requestAnimationFrame(paso)), retraso);
    return () => {
      clearTimeout(id);
      cancelAnimationFrame(raf);
      el.textContent = `${prefijo}${valor}`;
    };
  }, [valor, prefijo, retraso]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefijo}
      {valor}
    </span>
  );
}
