/**
 * Production DB repair script — 3 idempotent fixes wrapped in a transaction.
 *
 *   Fix 1: Backfill `pedidos.Estado` = 'Cerrado' for legacy rows (Fecha < today, Estado='Activo').
 *   Fix 2: Recover `detallepedidos.PrecioUnitario` (0 or NULL) from `platos.Precio`.
 *   Fix 3: Recompute `pedidos.Total` where stored value differs from sum of details.
 *
 * Usage:
 *   npx tsx scripts/repair-db.ts --dry-run        # preview counts, NO writes
 *   npx tsx scripts/repair-db.ts                  # apply with interactive confirm
 *   npx tsx scripts/repair-db.ts --yes            # apply without confirm (CI)
 *   npx tsx scripts/repair-db.ts --only=1,3       # run only selected fixes
 *
 * IMPORTANT: take a pg_dump backup before running without --dry-run.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const connectionString: string = process.env.DATABASE_URL ?? "";
if (!connectionString) {
  console.error("DATABASE_URL no definido. Aborta.");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const skipConfirm = args.includes("--yes");
const onlyArg = args.find((a) => a.startsWith("--only="));
const onlySet: Set<number> | null = onlyArg
  ? new Set(
      onlyArg
        .replace("--only=", "")
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n)),
    )
  : null;

const shouldRun = (n: number) => !onlySet || onlySet.has(n);

async function confirm(question: string): Promise<boolean> {
  if (skipConfirm) return true;
  const rl = readline.createInterface({ input, output });
  const answer = (await rl.question(`${question} (yes/NO): `)).trim().toLowerCase();
  rl.close();
  return answer === "yes" || answer === "y";
}

function banner(text: string) {
  console.log(`\n${"=".repeat(text.length + 6)}`);
  console.log(`   ${text}`);
  console.log(`${"=".repeat(text.length + 6)}\n`);
}

async function previewFix1(): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*)::bigint AS count
     FROM pedidos
     WHERE "Estado" = 'Activo' AND "Fecha" < CURRENT_DATE`,
  );
  return Number(rows[0]?.count ?? 0);
}

async function previewFix2(): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*)::bigint AS count
     FROM detallepedidos d
     JOIN platos p ON p."PlatoID" = d."PlatoID"
     WHERE (d."PrecioUnitario" = 0 OR d."PrecioUnitario" IS NULL)
       AND p."Precio" IS NOT NULL AND p."Precio" > 0`,
  );
  return Number(rows[0]?.count ?? 0);
}

async function previewFix3(): Promise<{ count: number; sample: Array<{ PedidoID: number; Total: string; suma: string }> }> {
  const rows = await prisma.$queryRawUnsafe<Array<{ PedidoID: number; Total: string; suma: string }>>(
    `SELECT pe."PedidoID", pe."Total"::text AS "Total", sub.suma::text AS suma
     FROM pedidos pe
     JOIN (
       SELECT "PedidoID", SUM("Cantidad" * "PrecioUnitario") AS suma
       FROM detallepedidos
       GROUP BY "PedidoID"
     ) sub ON sub."PedidoID" = pe."PedidoID"
     WHERE pe."Total" <> sub.suma
     ORDER BY pe."PedidoID" DESC
     LIMIT 25`,
  );
  const countRows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*)::bigint AS count
     FROM pedidos pe
     JOIN (
       SELECT "PedidoID", SUM("Cantidad" * "PrecioUnitario") AS suma
       FROM detallepedidos
       GROUP BY "PedidoID"
     ) sub ON sub."PedidoID" = pe."PedidoID"
     WHERE pe."Total" <> sub.suma`,
  );
  return { count: Number(countRows[0]?.count ?? 0), sample: rows };
}

async function main() {
  banner(dryRun ? "REPAIR DB — DRY RUN (no writes)" : "REPAIR DB — APPLY MODE");

  console.log("Conexion:", connectionString.replace(/:[^@]+@/, ":***@"));
  console.log("Fixes seleccionados:", onlySet ? Array.from(onlySet).join(", ") : "1, 2, 3");

  // === Preview ===
  const previews: Record<string, unknown> = {};

  if (shouldRun(1)) {
    const n = await previewFix1();
    previews["Fix 1 — pedidos Activo→Cerrado (Fecha < hoy)"] = { afectaria: n };
  }
  if (shouldRun(2)) {
    const n = await previewFix2();
    previews["Fix 2 — detallepedidos PrecioUnitario recuperado de Plato.Precio"] = { afectaria: n };
  }
  if (shouldRun(3)) {
    const { count, sample } = await previewFix3();
    previews["Fix 3 — pedidos.Total recomputado desde suma de detalles"] = {
      afectaria: count,
      muestra: sample,
    };
  }

  banner("PREVIEW");
  console.dir(previews, { depth: 6, colors: true });

  if (dryRun) {
    banner("DRY RUN — fin. Nada cambia.");
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  const ok = await confirm("Aplicar fixes en transaccion?");
  if (!ok) {
    console.log("Cancelado por usuario. Nada cambia.");
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  // === Apply inside transaction ===
  const results = await prisma.$transaction(
    async (tx) => {
      const out: Record<string, number> = {};

      if (shouldRun(1)) {
        const n = await tx.$executeRawUnsafe(
          `UPDATE pedidos
           SET "Estado" = 'Cerrado'
           WHERE "Estado" = 'Activo' AND "Fecha" < CURRENT_DATE`,
        );
        out["fix1_pedidos_actualizados"] = n;
      }

      if (shouldRun(2)) {
        const n = await tx.$executeRawUnsafe(
          `UPDATE detallepedidos d
           SET "PrecioUnitario" = p."Precio"
           FROM platos p
           WHERE d."PlatoID" = p."PlatoID"
             AND (d."PrecioUnitario" = 0 OR d."PrecioUnitario" IS NULL)
             AND p."Precio" IS NOT NULL AND p."Precio" > 0`,
        );
        out["fix2_detalles_actualizados"] = n;
      }

      if (shouldRun(3)) {
        const n = await tx.$executeRawUnsafe(
          `UPDATE pedidos pe
           SET "Total" = sub.suma
           FROM (
             SELECT "PedidoID", SUM("Cantidad" * "PrecioUnitario") AS suma
             FROM detallepedidos
             GROUP BY "PedidoID"
           ) sub
           WHERE pe."PedidoID" = sub."PedidoID"
             AND pe."Total" <> sub.suma`,
        );
        out["fix3_pedidos_total_recomputado"] = n;
      }

      return out;
    },
    { timeout: 120_000, maxWait: 10_000 },
  );

  banner("RESULTADO");
  console.dir(results, { depth: 4, colors: true });

  // === Post-verification ===
  const post = {
    pedidos_activos_restantes: Number(
      (
        await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*)::bigint AS count FROM pedidos WHERE "Estado" = 'Activo'`,
        )
      )[0]?.count ?? 0,
    ),
    pedidos_cerrados: Number(
      (
        await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*)::bigint AS count FROM pedidos WHERE "Estado" = 'Cerrado'`,
        )
      )[0]?.count ?? 0,
    ),
    detalles_precio_cero_restantes: Number(
      (
        await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*)::bigint AS count FROM detallepedidos WHERE "PrecioUnitario" = 0 OR "PrecioUnitario" IS NULL`,
        )
      )[0]?.count ?? 0,
    ),
    pedidos_total_mismatch_restantes: Number(
      (
        await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*)::bigint AS count
           FROM pedidos pe
           JOIN (
             SELECT "PedidoID", SUM("Cantidad" * "PrecioUnitario") AS suma
             FROM detallepedidos
             GROUP BY "PedidoID"
           ) sub ON sub."PedidoID" = pe."PedidoID"
           WHERE pe."Total" <> sub.suma`,
        )
      )[0]?.count ?? 0,
    ),
  };

  banner("VERIFICACION POST-FIX");
  console.dir(post, { depth: 4, colors: true });

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (err) => {
  console.error("\nERROR — transaccion abortada, nada se aplico:");
  console.error(err);
  await prisma.$disconnect().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(1);
});
