-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "roundId" TEXT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "matchDays" TEXT[],
ADD COLUMN     "matchDuration" INTEGER NOT NULL DEFAULT 90,
ADD COLUMN     "matchesPerDay" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "roundTrip" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Round_tenantId_number_key" ON "Round"("tenantId", "number");

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE SET NULL ON UPDATE CASCADE;
