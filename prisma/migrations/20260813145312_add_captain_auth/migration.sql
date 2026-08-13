-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'CAPTAIN';

-- AlterTable
ALTER TABLE "TenantUser" ADD COLUMN     "teamId" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "TenantUser" ADD CONSTRAINT "TenantUser_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
