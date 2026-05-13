-- AlterTable: add IdempotencyKey to pedidos (idempotent)
ALTER TABLE "public"."pedidos" ADD COLUMN IF NOT EXISTS "IdempotencyKey" UUID;

-- CreateIndex: unique on IdempotencyKey (idempotent via DO block)
DO $do$ BEGIN
    CREATE UNIQUE INDEX "pedidos_IdempotencyKey_key" ON "public"."pedidos"("IdempotencyKey");
EXCEPTION WHEN duplicate_table THEN NULL; END $do$;