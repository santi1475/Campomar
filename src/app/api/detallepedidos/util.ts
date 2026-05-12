import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function recalcularTotal(
  pedidoId: number,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const prismaClient = tx ?? prisma;

  const detalles = await prismaClient.detallepedidos.findMany({
    where: { PedidoID: pedidoId },
    include: { platos: true },
  });

  const cero = new Prisma.Decimal(0);

  const nuevoTotal = detalles.reduce((acc, detalle) => {
    const precio = new Prisma.Decimal(detalle.PrecioUnitario ?? 0);
    const cantidad = new Prisma.Decimal(detalle.Cantidad);
    return acc.plus(precio.mul(cantidad));
  }, cero);

  await prismaClient.pedidos.update({
    where: { PedidoID: pedidoId },
    data: { Total: nuevoTotal },
  });
}
