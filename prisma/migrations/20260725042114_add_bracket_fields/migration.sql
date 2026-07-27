-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "bracketOrder" INTEGER;

-- AlterTable
ALTER TABLE "Round" ADD COLUMN     "bracketLabel" TEXT,
ADD COLUMN     "bracketStage" INTEGER;
