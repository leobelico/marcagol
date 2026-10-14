-- AlterTable
ALTER TABLE "EncuestaArbitral" ADD COLUMN     "refereeId" TEXT;

-- CreateIndex
CREATE INDEX "EncuestaArbitral_refereeId_idx" ON "EncuestaArbitral"("refereeId");

-- AddForeignKey
ALTER TABLE "EncuestaArbitral" ADD CONSTRAINT "EncuestaArbitral_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "Referee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
