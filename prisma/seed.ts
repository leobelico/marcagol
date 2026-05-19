import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Limpiar en orden correcto
// 1. Limpiar en orden correcto
await prisma.matchEvent.deleteMany();
await prisma.match.deleteMany();
await prisma.playerStat.deleteMany();
await prisma.player.deleteMany();
await prisma.referee.deleteMany();  // ← agregar esto antes de team y tenant
await prisma.team.deleteMany();
await prisma.tenantUser.deleteMany();
await prisma.finance.deleteMany();  // ← también este por si acaso
await prisma.round.deleteMany();    // ← y este
await prisma.tenant.deleteMany();
await prisma.user.deleteMany();

  console.log("✅ Base de datos limpia");

  // 2. Crear superadmin
 // 2. Crear superadmin
const hashedPassword = await bcrypt.hash("admin123", 10);
const superAdmin = await prisma.user.upsert({
  where: { email: "admin@futbol.com" },
  update: { isSuperAdmin: true }, // ← agregar
  create: {
    email: "admin@futbol.com",
    name: "Super Admin",
    password: hashedPassword,
    isSuperAdmin: true, // ← agregar
  },
});
  console.log("✅ Superadmin creado:", superAdmin.email);

  // 3. Crear tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: "Liga Regia",
      slug: "liga-regia",
      teams: {
        create: [
          {
            name: "Tigres FC",
            players: {
              create: [
                { name: "Carlos Méndez", number: 9, position: "Delantero", stats: { create: { goals: 8, assists: 3, yellow: 1, red: 0 } } },
                { name: "Luis Garza", number: 10, position: "Mediocampista", stats: { create: { goals: 5, assists: 7, yellow: 2, red: 0 } } },
                { name: "Pedro Ruiz", number: 7, position: "Delantero", stats: { create: { goals: 4, assists: 2, yellow: 0, red: 0 } } },
              ],
            },
          },
          {
            name: "Rayados United",
            players: {
              create: [
                { name: "Miguel Torres", number: 11, position: "Delantero", stats: { create: { goals: 6, assists: 4, yellow: 3, red: 1 } } },
                { name: "Juan López", number: 8, position: "Mediocampista", stats: { create: { goals: 3, assists: 5, yellow: 1, red: 0 } } },
              ],
            },
          },
          {
            name: "Broncos SC",
            players: {
              create: [
                { name: "Roberto Silva", number: 9, position: "Delantero", stats: { create: { goals: 7, assists: 1, yellow: 2, red: 0 } } },
                { name: "Andrés Mora", number: 6, position: "Defensa", stats: { create: { goals: 1, assists: 2, yellow: 4, red: 1 } } },
              ],
            },
          },
          {
            name: "Águilas CF",
            players: {
              create: [
                { name: "Diego Reyes", number: 10, position: "Mediocampista", stats: { create: { goals: 4, assists: 6, yellow: 1, red: 0 } } },
                { name: "Héctor Vega", number: 9, position: "Delantero", stats: { create: { goals: 3, assists: 2, yellow: 0, red: 0 } } },
              ],
            },
          },
        ],
      },
    },
  });
  console.log("✅ Tenant creado:", tenant.name);

  // 4. Crear partidos
  const teams = await prisma.team.findMany({ where: { tenantId: tenant.id } });
  const [tigres, rayados, broncos, aguilas] = teams;

  await prisma.match.createMany({
    data: [
      { tenantId: tenant.id, homeTeamId: tigres.id, awayTeamId: rayados.id, homeScore: 3, awayScore: 1, status: "FINISHED", date: new Date("2026-02-01") },
      { tenantId: tenant.id, homeTeamId: broncos.id, awayTeamId: aguilas.id, homeScore: 0, awayScore: 2, status: "FINISHED", date: new Date("2026-02-01") },
      { tenantId: tenant.id, homeTeamId: rayados.id, awayTeamId: broncos.id, homeScore: 1, awayScore: 1, status: "FINISHED", date: new Date("2026-02-08") },
      { tenantId: tenant.id, homeTeamId: aguilas.id, awayTeamId: tigres.id, homeScore: 0, awayScore: 1, status: "FINISHED", date: new Date("2026-02-08") },
      { tenantId: tenant.id, homeTeamId: tigres.id, awayTeamId: broncos.id, homeScore: 2, awayScore: 0, status: "FINISHED", date: new Date("2026-02-15") },
      { tenantId: tenant.id, homeTeamId: rayados.id, awayTeamId: aguilas.id, homeScore: 2, awayScore: 2, status: "FINISHED", date: new Date("2026-02-15") },
      { tenantId: tenant.id, homeTeamId: broncos.id, awayTeamId: tigres.id, homeScore: null, awayScore: null, status: "SCHEDULED", date: new Date("2026-03-07") },
      { tenantId: tenant.id, homeTeamId: aguilas.id, awayTeamId: rayados.id, homeScore: null, awayScore: null, status: "SCHEDULED", date: new Date("2026-03-07") },
    ],
  });
  console.log("✅ Partidos creados");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());