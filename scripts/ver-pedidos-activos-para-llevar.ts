import "dotenv/config";
import { PrismaClient, PedidoEstado } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const cs = process.env.DATABASE_URL ?? "";
const pool = new Pool({ connectionString: cs });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  // Query active orders
  const activeOrders = await prisma.pedidos.findMany({
    where: {
      Estado: PedidoEstado.Activo,
    },
    include: {
      pedido_mesas: {
        select: {
          MesaID: true,
        },
      },
    },
    orderBy: {
      PedidoID: "desc",
    },
  });

  console.log(`Encontrados ${activeOrders.length} pedidos activos en total.`);
  
  const paraLlevar = activeOrders.filter(o => o.ParaLlevar);
  const paraMesa = activeOrders.filter(o => !o.ParaLlevar);

  console.log(`\n--- Pedidos Activos Para Llevar (${paraLlevar.length}) ---`);
  paraLlevar.forEach(o => {
    console.log(`PedidoID: ${o.PedidoID} | Fecha: ${o.Fecha?.toISOString()} | Total: ${o.Total} | EmpleadoID: ${o.EmpleadoID}`);
  });

  console.log(`\n--- Pedidos Activos En Mesa (${paraMesa.length}) ---`);
  paraMesa.slice(0, 10).forEach(o => {
    const mesasStr = o.pedido_mesas.map(m => m.MesaID).join(", ");
    console.log(`PedidoID: ${o.PedidoID} | Mesa(s): ${mesasStr || "Ninguna"} | Fecha: ${o.Fecha?.toISOString()} | Total: ${o.Total}`);
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
