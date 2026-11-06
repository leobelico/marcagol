-- MarcaGol TV: video del partido (YouTube en vivo o grabado) y clip por
-- evento. Cada evento guarda además la hora real en que se capturó, para
-- poder cortar el clip de la grabación de la cancha. Los eventos viejos
-- quedan sin hora (NULL).
ALTER TABLE "Match" ADD COLUMN "videoUrl" TEXT;

ALTER TABLE "MatchEvent" ADD COLUMN "clipUrl" TEXT;
ALTER TABLE "MatchEvent" ADD COLUMN "createdAt" TIMESTAMP(3);
ALTER TABLE "MatchEvent" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
