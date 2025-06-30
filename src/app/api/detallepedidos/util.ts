import prisma from "@/lib/db";

export async function recalcularTotal(pedidoId: number) {
  const detalles = await prisma.detallepedidos.findMany({
    where: { PedidoID: pedidoId },
    include: { platos: true },
  });

  const nuevoTotal = detalles.reduce((acc, detalle) => {
    return acc + detalle.Cantidad * detalle.platos.Precio!.toNumber();
  }, 0);

  await prisma.pedidos.update({
    where: { PedidoID: pedidoId },
    data: { Total: nuevoTotal },
  });
}
