-- CreateEnum (idempotent)
DO $do$ BEGIN
    CREATE TYPE "public"."MesaEstado" AS ENUM ('Libre', 'Ocupada', 'Reservada');
EXCEPTION WHEN duplicate_object THEN NULL; END $do$;

-- CreateEnum (idempotent)
DO $do$ BEGIN
    CREATE TYPE "public"."PedidoEstado" AS ENUM ('Activo', 'Cerrado');
EXCEPTION WHEN duplicate_object THEN NULL; END $do$;

-- AlterTable: mesas.Estado text -> MesaEstado (preserve data via USING, idempotent)
DO $do$ BEGIN
    IF (SELECT udt_name FROM information_schema.columns
        WHERE table_schema='public' AND table_name='mesas' AND column_name='Estado') <> 'MesaEstado' THEN
        ALTER TABLE "public"."mesas" ALTER COLUMN "Estado" DROP DEFAULT;
        ALTER TABLE "public"."mesas"
            ALTER COLUMN "Estado" TYPE "public"."MesaEstado"
            USING "Estado"::text::"public"."MesaEstado";
        ALTER TABLE "public"."mesas" ALTER COLUMN "Estado" SET DEFAULT 'Libre'::"public"."MesaEstado";
    END IF;
END $do$;

-- AlterTable: pedidos.Estado boolean -> PedidoEstado (preserve data via USING, idempotent)
DO $do$ BEGIN
    IF (SELECT udt_name FROM information_schema.columns
        WHERE table_schema='public' AND table_name='pedidos' AND column_name='Estado') <> 'PedidoEstado' THEN
        ALTER TABLE "public"."pedidos" ALTER COLUMN "Estado" DROP DEFAULT;
        ALTER TABLE "public"."pedidos"
            ALTER COLUMN "Estado" TYPE "public"."PedidoEstado"
            USING CASE WHEN "Estado" = true THEN 'Activo'::"public"."PedidoEstado" ELSE 'Cerrado'::"public"."PedidoEstado" END;
        ALTER TABLE "public"."pedidos" ALTER COLUMN "Estado" SET DEFAULT 'Activo'::"public"."PedidoEstado";
    END IF;
END $do$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "empleados_DNI_idx" ON "public"."empleados"("DNI");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "mesas_Estado_idx" ON "public"."mesas"("Estado");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "pedidos_Estado_idx" ON "public"."pedidos"("Estado");