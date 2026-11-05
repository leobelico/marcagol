-- Datos de contacto de la organización (la liga) para mostrarlos en la app:
-- quién la organiza y sus redes
ALTER TABLE "Organization" ADD COLUMN "contactName" TEXT;
ALTER TABLE "Organization" ADD COLUMN "instagram" TEXT;
ALTER TABLE "Organization" ADD COLUMN "facebook" TEXT;
ALTER TABLE "Organization" ADD COLUMN "whatsapp" TEXT;
