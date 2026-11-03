-- La apertura manual de la encuesta pasa de la organización a cada liga
-- (así también funciona para las ligas sin organización)
ALTER TABLE "Organization" DROP COLUMN "prefsForzadas";

ALTER TABLE "Tenant" ADD COLUMN "prefsAbiertas" BOOLEAN NOT NULL DEFAULT false;
