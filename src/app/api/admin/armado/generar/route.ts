// Genera la propuesta de jornada de toda la organización para una
// semana. NO guarda nada: el admin la revisa, la ajusta y la publica.
import { NextRequest, NextResponse } from "next/server";
import { cargarArmado, requireOrgAdmin } from "@/lib/armadoRolServer";
import { generarPropuesta } from "@/lib/armadoRol";
import { lunesDe, semanaObjetivo, ymd } from "@/lib/rol";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const guard = await requireOrgAdmin(body.org);
  if ("error" in guard) return guard.error;

  const semana = (typeof body.semana === "string" && lunesDe(body.semana)) || semanaObjetivo();

  // Ligas a incluir (por defecto todas las configuradas con horarios)
  const pedidas: string[] | null = Array.isArray(body.ligas) ? body.ligas : null;
  const tenantIds = pedidas ? guard.tenantIds.filter((id) => pedidas.includes(id)) : guard.tenantIds;

  const { ligas, ocupados, ligasConPartidos } = await cargarArmado(tenantIds, semana);
  const listas = ligas.filter((l) => l.horas.length > 0 && l.equipos.length >= 2);
  const omitidas = ligas
    .filter((l) => !listas.includes(l))
    .map((l) => ({
      id: l.id,
      name: l.name,
      motivo: l.horas.length === 0 ? "Sin horarios de bloque configurados" : "Menos de 2 equipos",
    }));

  const propuesta = generarPropuesta(listas, ocupados);

  return NextResponse.json({
    semana: ymd(semana),
    ligas: listas,
    omitidas,
    ocupados,
    ligasConPartidos,
    ...propuesta,
  });
}
