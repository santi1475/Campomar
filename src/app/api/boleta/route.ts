import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pedidoID = searchParams.get("pedidoID");

  if (!pedidoID) {
    return NextResponse.json(
      { message: "Debe proporcionar un ID de pedido" },
      { status: 400 }
    );
  }

  try {
    const pedido = await prisma.pedidos.findUnique({
      where: { PedidoID: parseInt(pedidoID) },
      include: {
        empleados: true, // Incluye los datos del empleado
        detallepedidos: {
          include: {
            platos: true, // Incluye los detalles del plato
          },
        },
        tipopago: true, // Incluye el tipo de pago
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { message: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // Formatear los datos de la boleta
    const boleta = {
      PedidoID: pedido.PedidoID,
      Empleado: pedido.empleados?.Nombre || "Desconocido",
      Fecha: pedido.Fecha,
      Detalles: pedido.detallepedidos.map((detalle) => ({
        Producto: detalle.platos?.Descripcion || "Producto desconocido",
        Cantidad: detalle.Cantidad,
        PrecioUnitario: detalle.platos?.Precio || 0,
        Subtotal: (Number(detalle.Cantidad) * Number(detalle.platos?.Precio || 0)).toFixed(2),
      })),
      Total: pedido.Total.toFixed(2),
      TipoPago: pedido.tipopago?.Descripcion || "No especificado",
    };

    return NextResponse.json(boleta);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al obtener el pedido", error },
      { status: 500 }
    );
  }
}
