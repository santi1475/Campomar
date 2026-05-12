import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const cs = process.env.DATABASE_URL ?? "";
const pool = new Pool({ connectionString: cs });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const counts = await prisma.$queryRawUnsafe<
    Array<{ total_activos: bigint; activos_con_tipopago: bigint; activos_sin_tipopago: bigint }>
  >(`
    SELECT
      COUNT(*) FILTER (WHERE "Estado" = 'Activo') AS total_activos,
      COUNT(*) FILTER (WHERE "Estado" = 'Activo' AND "TipoPago" IS NOT NULL) AS activos_con_tipopago,
      COUNT(*) FILTER (WHERE "Estado" = 'Activo' AND "TipoPago" IS NULL) AS activos_sin_tipopago
    FROM pedidos
    WHERE "Fecha" >= CURRENT_DATE
  `);

  console.log("Pedidos HOY:");
  console.dir(
    {
      total_activos: Number(counts[0].total_activos),
      activos_con_tipopago: Number(counts[0].activos_con_tipopago),
      activos_sin_tipopago: Number(counts[0].activos_sin_tipopago),
    },
    { depth: 4 },
  );

  const mesas = await prisma.$queryRawUnsafe<Array<{ Estado: string; count: bigint }>>(`
    SELECT "Estado"::text AS "Estado", COUNT(*)::bigint AS count
    FROM mesas GROUP BY "Estado"
  `);
  console.log("\nMesas por estado:");
  console.dir(mesas.map((m) => ({ Estado: m.Estado, count: Number(m.count) })), { depth: 4 });

  const pedidoMesasActivas = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
    SELECT COUNT(*)::bigint AS count
    FROM pedido_mesas pm
    JOIN pedidos p ON p."PedidoID" = pm."PedidoID"
    WHERE p."Estado" = 'Activo'
  `);
  console.log("\npedido_mesas vinculadas a pedidos Activos:", Number(pedidoMesasActivas[0].count));

  const muestra = await prisma.$queryRawUnsafe<
    Array<{
      PedidoID: number;
      Fecha: Date;
      TipoPago: number | null;
      Total: string;
      mesas: string;
    }>
  >(`
    SELECT p."PedidoID", p."Fecha", p."TipoPago", p."Total"::text AS "Total",
      COALESCE((SELECT string_agg(pm."MesaID"::text, ',') FROM pedido_mesas pm WHERE pm."PedidoID" = p."PedidoID"), '') AS mesas
    FROM pedidos p
    WHERE p."Fecha" >= CURRENT_DATE AND p."Estado" = 'Activo'
    ORDER BY p."PedidoID" DESC
  `);
  console.log("\nMuestra pedidos activos HOY:");
  console.dir(muestra, { depth: 4 });

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
