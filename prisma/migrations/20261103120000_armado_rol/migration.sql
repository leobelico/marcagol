-- CreateEnum
CREATE TYPE "CategoriaLiga" AS ENUM ('FEMENIL', 'MIXTA', 'VARONIL');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "categoria" "CategoriaLiga",
ADD COLUMN "horarios" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "prefsForzadas" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN "diaComprado" TEXT,
ADD COLUMN "horaComprada" TEXT,
ADD COLUMN "prioridadCompra" INTEGER;

-- CreateTable
CREATE TABLE "PreferenciaRol" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "semana" TIMESTAMP(3) NOT NULL,
    "opciones" JSONB NOT NULL,
    "bloqueos" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreferenciaRol_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PreferenciaRol_tenantId_semana_idx" ON "PreferenciaRol"("tenantId", "semana");

-- CreateIndex
CREATE UNIQUE INDEX "PreferenciaRol_teamId_semana_key" ON "PreferenciaRol"("teamId", "semana");

-- AddForeignKey
ALTER TABLE "PreferenciaRol" ADD CONSTRAINT "PreferenciaRol_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenciaRol" ADD CONSTRAINT "PreferenciaRol_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
