// Encuesta semanal de horarios del capitán (web y app móvil).
// GET  ?teamId=  → tabla de días/horas de su liga, lo que ya mandó y la saturación
// PUT  { teamId, opciones, bloqueos } → guarda (solo con la ventana abierta)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { diasDeLiga, saturacionOrganizacion } from "@/lib/armadoRolServer";
import {
  MAX_OPCIONES,
  MIN_OPCIONES,
  maxBloqueos,
  ordenarHoras,
  parseCasillas,
  parseOpciones,
  semanaObjetivo,
  validarSeleccion,
  ventanaAbierta,
  ymd,
} from "@/lib/rol";

async function cargarEquipo(teamId: string | null) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  if (!teamId) return { error: NextResponse.json({ error: "Falta el equipo" }, { status: 400 }) };

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { tenant: { include: { organization: { select: { prefsForzadas: true } } } } },
  });
  if (!team) return { error: NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 }) };

  const esSuper = !!(session.user as any).isSuperAdmin;
  if (!esSuper) {
    const capitan = await prisma.teamCaptain.findFirst({
      where: { teamId, tenantUser: { userId: session.user.id } },
    });
    if (!capitan) {
      return { error: NextResponse.json({ error: "No eres capitán de este equipo" }, { status: 403 }) };
    }
  }

  const abierta = ventanaAbierta() || !!team.tenant.organization?.prefsForzadas;
  return { team, abierta };
}

export async function GET(req: NextRequest) {
  const r = await cargarEquipo(req.nextUrl.searchParams.get("teamId"));
  if ("error" in r) return r.error;
  const { team, abierta } = r;

  const semana = semanaObjetivo();
  const dias = diasDeLiga(team.tenant.matchDays);
  const horas = ordenarHoras(team.tenant.horarios);

  const [pref, saturacion] = await Promise.all([
    prisma.preferenciaRol.findUnique({ where: { teamId_semana: { teamId: team.id, semana } } }),
    saturacionOrganizacion(team.tenant.organizationId, team.tenantId, semana),
  ]);

  return NextResponse.json({
    abierta,
    semana: ymd(semana),
    dias,
    horas,
    configurada: horas.length > 0,
    opciones: parseOpciones(pref?.opciones),
    bloqueos: parseCasillas(pref?.bloqueos),
    enviadoEl: pref?.updatedAt ?? null,
    saturacion,
    compra: {
      dia: team.diaComprado,
      hora: team.horaComprada,
    },
    limites: {
      minOpciones: MIN_OPCIONES,
      maxOpciones: MAX_OPCIONES,
      maxBloqueos: maxBloqueos(dias.length * horas.length, MIN_OPCIONES),
    },
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const r = await cargarEquipo(typeof body.teamId === "string" ? body.teamId : null);
  if ("error" in r) return r.error;
  const { team, abierta } = r;

  if (!abierta) {
    return NextResponse.json(
      { error: "La encuesta de horarios solo está abierta los miércoles de 9:00 a 21:00." },
      { status: 403 }
    );
  }

  const opciones = parseOpciones(body.opciones);
  const bloqueos = parseCasillas(body.bloqueos);
  const dias = diasDeLiga(team.tenant.matchDays);
  const horas = ordenarHoras(team.tenant.horarios);

  const errores = validarSeleccion(opciones, bloqueos, dias, horas);
  if (errores.length > 0) {
    return NextResponse.json({ error: errores[0], errores }, { status: 400 });
  }

  const semana = semanaObjetivo();
  const pref = await prisma.preferenciaRol.upsert({
    where: { teamId_semana: { teamId: team.id, semana } },
    create: { teamId: team.id, tenantId: team.tenantId, semana, opciones, bloqueos },
    update: { opciones, bloqueos },
  });

  return NextResponse.json({ ok: true, enviadoEl: pref.updatedAt });
}
