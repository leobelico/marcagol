BEGIN;

CREATE TABLE IF NOT EXISTS "TeamCaptain" (
    "id" TEXT NOT NULL,
    "tenantUserId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamCaptain_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TeamCaptain_tenantUserId_teamId_key"
    ON "TeamCaptain"("tenantUserId", "teamId");

ALTER TABLE "TeamCaptain"
    ADD CONSTRAINT "TeamCaptain_tenantUserId_fkey"
    FOREIGN KEY ("tenantUserId") REFERENCES "TenantUser"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamCaptain"
    ADD CONSTRAINT "TeamCaptain_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Team"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "TeamCaptain" ("id", "tenantUserId", "teamId", "createdAt")
SELECT
    gen_random_uuid()::text,
    tu."id",
    tu."teamId",
    CURRENT_TIMESTAMP
FROM "TenantUser" tu
WHERE tu."teamId" IS NOT NULL
ON CONFLICT ("tenantUserId", "teamId") DO NOTHING;

ALTER TABLE "TenantUser" DROP CONSTRAINT IF EXISTS "TenantUser_teamId_fkey";
ALTER TABLE "TenantUser" DROP COLUMN IF EXISTS "teamId";

COMMIT;