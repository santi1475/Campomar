import prisma from "@/lib/db";
import { Prisma, detallepedidos } from "@prisma/client";

export async function recalcularTotal(pedidoId: number, tx?: any) {
  const prismaClient = tx || prisma;
  
  const detalles = await prismaClient.detallepedidos.findMany({
    where: { PedidoID: pedidoId },
    include: { platos: true },
  });

  const nuevoTotal = detalles.reduce((acc: Prisma.Decimal, detalle: detallepedidos & { platos: { Precio: Prisma.Decimal | null } }) => {
    // Usamos Prisma.Decimal para mantener la precisión decimal
    const precio = detalle.platos.Precio || new Prisma.Decimal(0);
    const cantidad = new Prisma.Decimal(detalle.Cantidad);
    return acc.plus(precio.mul(cantidad));
  }, new Prisma.Decimal(0));

  await prismaClient.pedidos.update({
    where: { PedidoID: pedidoId },
    data: { Total: nuevoTotal },
  });
}
