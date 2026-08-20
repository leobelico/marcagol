// migrate-liga-rinos.ts
//
// Script de migración de datos (correr UNA sola vez, después de aplicar
// la migración de schema que agrega Organization y OrgUser).
//
// Qué hace:
// 1. Crea la Organization "Liga Rinos" (si no existe ya)
// 2. Asocia TODOS los Tenants que aún no tengan organizationId a Liga Rinos
// 3. Imprime un resumen de cuántos tenants se actualizaron
//
// Cómo correrlo:
//   npx tsx migrate-liga-rinos.ts
// (o con ts-node, según lo que ya uses en el proyecto)

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Mismo patrón que lib/prisma.ts: Neon usa el adapter pattern de Prisma 7,
// no acepta `datasources` en el constructor clásico.
neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Iniciando migración: asociar torneos existentes a Liga Rinos...\n");

  // 1. Crear (o recuperar) la organización Liga Rinos
  const ligaRinos = await prisma.organization.upsert({
    where: { slug: "liga-rinos" },
    update: {},
    create: {
      name: "Liga Rinos",
      slug: "liga-rinos",
    },
  });

  console.log(`Organización lista: ${ligaRinos.name} (id: ${ligaRinos.id})\n`);

  // 2. Buscar tenants sin organización asignada
  const tenantsSinOrg = await prisma.tenant.findMany({
    where: { organizationId: null },
    select: { id: true, name: true, slug: true },
  });

  if (tenantsSinOrg.length === 0) {
    console.log("No hay torneos pendientes de asociar. Todo listo.");
    return;
  }

  console.log(`Torneos a asociar (${tenantsSinOrg.length}):`);
  tenantsSinOrg.forEach((t) => console.log(`  - ${t.name} (${t.slug})`));
  console.log("");

  // 3. Actualizar todos en batch
  const result = await prisma.tenant.updateMany({
    where: { organizationId: null },
    data: { organizationId: ligaRinos.id },
  });

  console.log(`\n✅ ${result.count} torneos asociados a Liga Rinos.`);
}

main()
  .catch((e) => {
    console.error("❌ Error durante la migración:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });