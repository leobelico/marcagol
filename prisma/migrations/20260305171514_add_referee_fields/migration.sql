-- AlterTable
ALTER TABLE "Referee" ADD COLUMN     "email" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "payPerMatch" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "phone" TEXT;
