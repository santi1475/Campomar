import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

// Recalcula el total de un pedido respetando PrecioLlevar cuando corresponde
export async function recalcularTotal(pedidoId: number, tx?: any) {
  const prismaClient = tx || prisma;

  // Traer pedido para saber si es ParaLlevar
  const pedido = await prismaClient.pedidos.findUnique({
    where: { PedidoID: pedidoId },
    select: { ParaLlevar: true },
  });

  const esPedidoParaLlevarCompleto = pedido?.ParaLlevar === true;

  const detalles = await prismaClient.detallepedidos.findMany({
    where: { PedidoID: pedidoId },
    include: { platos: true },
  });

  const cero = new Prisma.Decimal(0);

  const nuevoTotal = detalles.reduce((acc: Prisma.Decimal, detalle: any) => {

    let precio: Prisma.Decimal = detalle.platos?.Precio || cero;
    const precioLlevar: Prisma.Decimal | null = detalle.platos?.PrecioLlevar ?? null;

    const usarPrecioLlevar = (esPedidoParaLlevarCompleto || detalle.ParaLlevar) && precioLlevar && precioLlevar.greaterThan(cero);
    
    if (usarPrecioLlevar) {
      precio = precioLlevar;
    }
    const cantidad = new Prisma.Decimal(detalle.Cantidad);
    return acc.plus(precio.mul(cantidad));
  }, cero);

  await prismaClient.pedidos.update({
    where: { PedidoID: pedidoId },
    data: { Total: nuevoTotal },
  });
}