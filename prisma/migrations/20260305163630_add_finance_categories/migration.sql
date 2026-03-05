-- CreateEnum
CREATE TYPE "FinanceCategory" AS ENUM ('CUOTA_EQUIPO', 'PAGO_ARBITRO', 'GASTO_CANCHA', 'GASTO_TROFEOS', 'GASTO_GENERAL', 'PREMIO', 'OTRO');

-- AlterTable
ALTER TABLE "Finance" ADD COLUMN     "category" "FinanceCategory" NOT NULL DEFAULT 'OTRO',
ADD COLUMN     "teamId" TEXT;

-- AddForeignKey
ALTER TABLE "Finance" ADD CONSTRAINT "Finance_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
