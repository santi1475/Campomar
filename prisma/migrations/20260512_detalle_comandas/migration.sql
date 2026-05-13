-- CreateTable: detalle_comandas (idempotent)
CREATE TABLE IF NOT EXISTS "public"."detalle_comandas" (
    "ComandaDetalleID" SERIAL NOT NULL,
    "ComandaID" INTEGER NOT NULL,
    "PlatoID" INTEGER NOT NULL,
    "Cantidad" INTEGER NOT NULL,
    "ParaLlevar" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "detalle_comandas_pkey" PRIMARY KEY ("ComandaDetalleID")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "detalle_comandas_ComandaID_idx" ON "public"."detalle_comandas"("ComandaID");
CREATE INDEX IF NOT EXISTS "detalle_comandas_PlatoID_idx" ON "public"."detalle_comandas"("PlatoID");

-- AddForeignKey: ComandaID -> comandas_cocina (idempotent)
DO $do$ BEGIN
    ALTER TABLE "public"."detalle_comandas"
        ADD CONSTRAINT "detalle_comandas_ComandaID_fkey"
        FOREIGN KEY ("ComandaID") REFERENCES "public"."comandas_cocina"("ComandaID")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $do$;

-- AddForeignKey: PlatoID -> platos (idempotent)
DO $do$ BEGIN
    ALTER TABLE "public"."detalle_comandas"
        ADD CONSTRAINT "detalle_comandas_PlatoID_fkey"
        FOREIGN KEY ("PlatoID") REFERENCES "public"."platos"("PlatoID")
        ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $do$;