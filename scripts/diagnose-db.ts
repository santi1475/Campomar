/**
 * Read-only diagnostic script for production DB integrity.
 * Run: npx tsx scripts/diagnose-db.ts
 * Optional: npx tsx scripts/diagnose-db.ts --json > diagnose.json
 *
 * NO writes. Only SELECT.
 */
import "dotenv/config";
import { PrismaClient, PedidoEstado, MesaEstado } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL no definido. Aborta.");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const jsonMode = process.argv.includes("--json");
const sections: Record<string, unknown> = {};

function section(name: string, payload: unknown) {
  sections[name] = payload;
  if (!jsonMode) {
    console.log(`\n=== ${name} ===`);
    console.dir(payload, { depth: 6, colors: true });
  }
}

async function main() {
  // 1. Conteos base
  const [pedidosCount, detallesCount, platosCount, mesasCount, comandasCount, auditoriaElimCount, pedidoMesasCount] =
    await Promise.all([
      prisma.pedidos.count(),
      prisma.detallepedidos.count(),
      prisma.platos.count(),
      prisma.mesas.count(),
      prisma.comandas_cocina.count(),
      prisma.auditoria_eliminaciones.count(),
      prisma.pedido_mesas.count(),
    ]);

  section("1. Conteos base", {
    pedidos: pedidosCount,
    detallepedidos: detallesCount,
    platos: platosCount,
    mesas: mesasCount,
    comandas_cocina: comandasCount,
    auditoria_eliminaciones: auditoriaElimCount,
    pedido_mesas: pedidoMesasCount,
  });

  // 2. Distribución Estado
  const pedidosPorEstado = await prisma.pedidos.groupBy({
    by: ["Estado"],
    _count: { _all: true },
  });
  const mesasPorEstado = await prisma.mesas.groupBy({
    by: ["Estado"],
    _count: { _all: true },
  });

  // Detección de valores fuera del enum (defensivo, usa raw)
  const pedidosEstadoRaw = await prisma.$queryRawUnsafe<
    { Estado: string; count: bigint }[]
  >(`SELECT "Estado"::text AS "Estado", COUNT(*)::bigint AS count FROM "public"."pedidos" GROUP BY "Estado"`);
  const mesasEstadoRaw = await prisma.$queryRawUnsafe<
    { Estado: string; count: bigint }[]
  >(`SELECT "Estado"::text AS "Estado", COUNT(*)::bigint AS count FROM "public"."mesas" GROUP BY "Estado"`);

  section("2. Distribución Estado", {
    pedidos: pedidosPorEstado.map((r) => ({ Estado: r.Estado, count: r._count._all })),
    pedidos_raw_text: pedidosEstadoRaw.map((r) => ({ Estado: r.Estado, count: Number(r.count) })),
    mesas: mesasPorEstado.map((r) => ({ Estado: r.Estado, count: r._count._all })),
    mesas_raw_text: mesasEstadoRaw.map((r) => ({ Estado: r.Estado, count: Number(r.count) })),
    enum_values_esperados: {
      PedidoEstado: Object.values(PedidoEstado),
      MesaEstado: Object.values(MesaEstado),
    },
  });

  // 3. Distribución NULL / cero
  // Raw queries usadas para columnas NOT NULL en schema — detecta drift real en DB
  const countRaw = async (sql: string): Promise<number> => {
    const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint | number }>>(sql);
    return Number(rows[0]?.count ?? 0);
  };

  const pedidosTotalNull = await countRaw(`SELECT COUNT(*)::bigint AS count FROM pedidos WHERE "Total" IS NULL`);
  const pedidosTotalCero = await countRaw(`SELECT COUNT(*)::bigint AS count FROM pedidos WHERE "Total" = 0`);
  const pedidosSinFecha = await countRaw(`SELECT COUNT(*)::bigint AS count FROM pedidos WHERE "Fecha" IS NULL`);
  const pedidosSinEmpleado = await countRaw(`SELECT COUNT(*)::bigint AS count FROM pedidos WHERE "EmpleadoID" IS NULL`);

  const detallesPrecioNull = await prisma.detallepedidos.count({ where: { PrecioUnitario: null } });
  const detallesPrecioCero = await prisma.detallepedidos.count({ where: { PrecioUnitario: 0 } });
  const detallesCantidadCero = await prisma.detallepedidos.count({ where: { Cantidad: 0 } });
  const detallesSinPedido = await countRaw(`SELECT COUNT(*)::bigint AS count FROM detallepedidos WHERE "PedidoID" IS NULL`);
  const detallesSinPlato = await countRaw(`SELECT COUNT(*)::bigint AS count FROM detallepedidos WHERE "PlatoID" IS NULL`);

  const platosSinPrecio = await prisma.platos.count({
    where: { OR: [{ Precio: null }, { Precio: 0 }] },
  });
  const platosSinPrecioLlevar = await prisma.platos.count({
    where: { OR: [{ PrecioLlevar: null }, { PrecioLlevar: 0 }] },
  });

  section("3. NULL / cero en columnas criticas", {
    pedidos: {
      Total_null: pedidosTotalNull,
      Total_cero: pedidosTotalCero,
      Fecha_null: pedidosSinFecha,
      EmpleadoID_null: pedidosSinEmpleado,
    },
    detallepedidos: {
      PrecioUnitario_null: detallesPrecioNull,
      PrecioUnitario_cero: detallesPrecioCero,
      Cantidad_cero: detallesCantidadCero,
      PedidoID_null: detallesSinPedido,
      PlatoID_null: detallesSinPlato,
    },
    platos: {
      Precio_null_o_cero: platosSinPrecio,
      PrecioLlevar_null_o_cero: platosSinPrecioLlevar,
    },
  });

  // 4. Orfandad
  const detallesOrfanosPedido = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::bigint AS count FROM "public"."detallepedidos" d
     LEFT JOIN "public"."pedidos" p ON p."PedidoID" = d."PedidoID"
     WHERE p."PedidoID" IS NULL`
  );
  const detallesOrfanosPlato = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::bigint AS count FROM "public"."detallepedidos" d
     LEFT JOIN "public"."platos" pl ON pl."PlatoID" = d."PlatoID"
     WHERE pl."PlatoID" IS NULL`
  );
  const pedidoMesasOrfanos = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::bigint AS count FROM "public"."pedido_mesas" pm
     LEFT JOIN "public"."pedidos" p ON p."PedidoID" = pm."PedidoID"
     LEFT JOIN "public"."mesas" m ON m."MesaID" = pm."MesaID"
     WHERE p."PedidoID" IS NULL OR m."MesaID" IS NULL`
  );
  const comandasSinPedido = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::bigint AS count FROM "public"."comandas_cocina" c
     LEFT JOIN "public"."pedidos" p ON p."PedidoID" = c."PedidoID"
     WHERE p."PedidoID" IS NULL`
  );

  section("4. Orfandad referencial", {
    detallepedidos_sin_pedido: Number(detallesOrfanosPedido[0]?.count ?? 0),
    detallepedidos_sin_plato: Number(detallesOrfanosPlato[0]?.count ?? 0),
    pedido_mesas_orfanos: Number(pedidoMesasOrfanos[0]?.count ?? 0),
    comandas_sin_pedido: Number(comandasSinPedido[0]?.count ?? 0),
  });

  // 5. Muestra reciente: 10 pedidos con detalles + total computado vs guardado
  const recientes = await prisma.pedidos.findMany({
    orderBy: { PedidoID: "desc" },
    take: 10,
    include: {
      detallepedidos: { include: { platos: true } },
      pedido_mesas: { include: { mesas: true } },
      empleados: { select: { EmpleadoID: true, Nombre: true } },
    },
  });

  const muestra = recientes.map((p) => {
    const detalles = p.detallepedidos.map((d) => {
      const precioGuardado = Number(d.PrecioUnitario ?? 0);
      const precioPlato = Number(d.platos?.Precio ?? 0);
      const precioLlevar = Number(d.platos?.PrecioLlevar ?? 0);
      return {
        DetalleID: d.DetalleID,
        PlatoID: d.PlatoID,
        Descripcion: d.platos?.Descripcion ?? "(plato faltante)",
        Cantidad: d.Cantidad,
        PrecioUnitario_guardado: precioGuardado,
        PrecioPlato_actual: precioPlato,
        PrecioLlevar_actual: precioLlevar,
        ParaLlevar: d.ParaLlevar,
        Impreso: d.Impreso,
        SubtotalGuardado: precioGuardado * d.Cantidad,
        SubtotalRecuperable:
          (d.ParaLlevar && precioLlevar > 0 ? precioLlevar : precioPlato) *
          d.Cantidad,
      };
    });
    const totalGuardado = Number(p.Total ?? 0);
    const totalRecomputado = detalles.reduce((acc, d) => acc + d.SubtotalGuardado, 0);
    const totalRecuperable = detalles.reduce((acc, d) => acc + d.SubtotalRecuperable, 0);

    return {
      PedidoID: p.PedidoID,
      Fecha: p.Fecha,
      Estado: p.Estado,
      ParaLlevar: p.ParaLlevar,
      TipoPago: p.TipoPago,
      Empleado: p.empleados,
      Total_guardado: totalGuardado,
      Total_recomputado_segun_detalles: totalRecomputado,
      Total_recuperable_segun_platos: totalRecuperable,
      detalles,
      mesas: p.pedido_mesas.map((pm) => pm.mesas?.NumeroMesa).filter(Boolean),
    };
  });

  section("5. Muestra 10 pedidos mas recientes", muestra);

  // 6. Recuperabilidad: detalles sin precio pero con plato con precio
  const detallesRecuperables = await prisma.$queryRawUnsafe<
    { total: bigint; con_plato_precio: bigint }[]
  >(
    `SELECT
       COUNT(*)::bigint AS total,
       SUM(CASE WHEN pl."Precio" IS NOT NULL AND pl."Precio" > 0 THEN 1 ELSE 0 END)::bigint AS con_plato_precio
     FROM "public"."detallepedidos" d
     LEFT JOIN "public"."platos" pl ON pl."PlatoID" = d."PlatoID"
     WHERE d."PrecioUnitario" IS NULL OR d."PrecioUnitario" = 0`
  );

  section("6. Recuperabilidad de precios", {
    detalles_sin_precio_total: Number(detallesRecuperables[0]?.total ?? 0),
    detalles_recuperables_via_plato: Number(detallesRecuperables[0]?.con_plato_precio ?? 0),
    no_recuperables:
      Number(detallesRecuperables[0]?.total ?? 0) -
      Number(detallesRecuperables[0]?.con_plato_precio ?? 0),
  });

  // 7. Pedidos cuyo Total guardado no concuerda con la suma de sus detalles
  const desajustes = await prisma.$queryRawUnsafe<
    { PedidoID: number; Total: string | null; suma: string }[]
  >(
    `SELECT p."PedidoID", p."Total"::text AS "Total",
       COALESCE(SUM(d."PrecioUnitario" * d."Cantidad"), 0)::text AS suma
     FROM "public"."pedidos" p
     LEFT JOIN "public"."detallepedidos" d ON d."PedidoID" = p."PedidoID"
     GROUP BY p."PedidoID", p."Total"
     HAVING ABS(COALESCE(p."Total", 0) - COALESCE(SUM(d."PrecioUnitario" * d."Cantidad"), 0)) > 0.01
     ORDER BY p."PedidoID" DESC
     LIMIT 25`
  );

  section("7. Top 25 pedidos con Total guardado ≠ suma de detalles", {
    count_listados: desajustes.length,
    muestra: desajustes,
  });

  // 8. Actividad ultimas 24h
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [pedidosUlt24, comandasUlt24, eliminacionesUlt24] = await Promise.all([
    prisma.pedidos.count({ where: { Fecha: { gte: desde } } }),
    prisma.comandas_cocina.count({ where: { FechaCreacion: { gte: desde } } }),
    prisma.auditoria_eliminaciones.count({ where: { Fecha: { gte: desde } } }),
  ]);

  section("8. Actividad ultimas 24 horas", {
    desde: desde.toISOString(),
    pedidos_creados: pedidosUlt24,
    comandas_cocina_creadas: comandasUlt24,
    eliminaciones_auditadas: eliminacionesUlt24,
  });

  // 9. Migraciones aplicadas
  const migraciones = await prisma.$queryRawUnsafe<
    {
      id: string;
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
      applied_steps_count: number;
    }[]
  >(
    `SELECT id, migration_name, finished_at, rolled_back_at, applied_steps_count
     FROM "public"."_prisma_migrations"
     ORDER BY started_at DESC
     LIMIT 30`
  );

  section("9. Migraciones (ultimas 30)", migraciones);

  // 10. Tipos reales de columnas criticas (para detectar drift schema)
  const tiposColumnas = await prisma.$queryRawUnsafe<
    { table_name: string; column_name: string; data_type: string; udt_name: string; is_nullable: string; column_default: string | null }[]
  >(
    `SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name IN ('pedidos', 'detallepedidos', 'platos', 'mesas')
       AND column_name IN ('Estado', 'Total', 'PrecioUnitario', 'Precio', 'PrecioLlevar', 'Cantidad', 'ParaLlevar', 'Impreso', 'IdempotencyKey', 'Fecha')
     ORDER BY table_name, column_name`
  );

  section("10. Tipos reales de columnas criticas", tiposColumnas);

  if (jsonMode) {
    console.log(JSON.stringify(sections, jsonReplacer, 2));
  } else {
    console.log("\n=== FIN ===\nEjecuta con --json para salida estructurada.");
  }
}

function jsonReplacer(_key: string, value: unknown) {
  if (typeof value === "bigint") return Number(value);
  if (value instanceof Date) return value.toISOString();
  return value;
}

main()
  .catch((err) => {
    console.error("ERROR diagnose-db:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
