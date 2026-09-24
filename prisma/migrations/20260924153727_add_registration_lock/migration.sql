-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "allowLateRegistration" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "registrationOpen" BOOLEAN NOT NULL DEFAULT true;
