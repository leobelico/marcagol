-- DropForeignKey
ALTER TABLE "TeamCaptain" DROP CONSTRAINT "TeamCaptain_teamId_fkey";

-- DropForeignKey
ALTER TABLE "TeamCaptain" DROP CONSTRAINT "TeamCaptain_tenantUserId_fkey";

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "folderId" TEXT;

-- CreateTable
CREATE TABLE "TenantFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "TenantFolder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenantFolder_organizationId_idx" ON "TenantFolder"("organizationId");

-- CreateIndex
CREATE INDEX "Tenant_folderId_idx" ON "Tenant"("folderId");

-- CreateIndex
CREATE INDEX "Tenant_organizationId_idx" ON "Tenant"("organizationId");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "TenantFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantFolder" ADD CONSTRAINT "TenantFolder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamCaptain" ADD CONSTRAINT "TeamCaptain_tenantUserId_fkey" FOREIGN KEY ("tenantUserId") REFERENCES "TenantUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamCaptain" ADD CONSTRAINT "TeamCaptain_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
