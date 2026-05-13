-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "bannerUrl" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "inscriptionFee" DOUBLE PRECISION,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "maxTeams" INTEGER,
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsapp" TEXT;
