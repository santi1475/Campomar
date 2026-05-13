/**
 * Cierra pedidos de hoy que tienen TipoPago set pero quedaron Activos
 * por el bug del Estado boolean→enum en el flujo de pago.
 *
 * Solo afecta pedidos de hoy con TipoPago IS NOT NULL.
 * Pedidos genuinamente activos (sin TipoPago) NO se tocan.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const cs = process.env.DATABASE_URL ?? "";
if (!cs) {
  console.error("DATABASE_URL no definido");
  process.exit(1);
}

const pool = new Pool({ connectionString: cs });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const dryRun = process.argv.includes("--dry-run");

async function main() {
  console.log(dryRun ? "DRY RUN — no writes" : "APPLY MODE");

  const previewCount = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
    SELECT COUNT(*)::bigint AS count
    FROM pedidos
    WHERE "Estado" = 'Activo'
      AND "Fecha" >= CURRENT_DATE
      AND "TipoPago" IS NOT NULL
  `);
  console.log("Pedidos a cerrar:", Number(previewCount[0].count));

  if (dryRun) {
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const cerrados = await tx.$executeRawUnsafe(`
        UPDATE pedidos
        SET "Estado" = 'Cerrado'
        WHERE "Estado" = 'Activo'
          AND "Fecha" >= CURRENT_DATE
          AND "TipoPago" IS NOT NULL
      `);
      return { cerrados };
    },
    { timeout: 60_000 },
  );

  console.log("Resultado:", result);

  const post = await prisma.$queryRawUnsafe<
    Array<{ activos_hoy: bigint; activos_total: bigint; pedido_mesas_activas: bigint }>
  >(`
    SELECT
      (SELECT COUNT(*)::bigint FROM pedidos WHERE "Estado" = 'Activo' AND "Fecha" >= CURRENT_DATE) AS activos_hoy,
      (SELECT COUNT(*)::bigint FROM pedidos WHERE "Estado" = 'Activo') AS activos_total,
      (SELECT COUNT(*)::bigint FROM pedido_mesas pm JOIN pedidos p ON p."PedidoID" = pm."PedidoID" WHERE p."Estado" = 'Activo') AS pedido_mesas_activas
  `);
  console.log("Verificacion post-fix:");
  console.dir(
    {
      activos_hoy: Number(post[0].activos_hoy),
      activos_total: Number(post[0].activos_total),
      pedido_mesas_activas: Number(post[0].pedido_mesas_activas),
    },
    { depth: 4 },
  );

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(1);
});
