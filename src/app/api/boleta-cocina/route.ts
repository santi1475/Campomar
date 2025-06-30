// route.ts
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
        detallepedidos: {
          include: {
            platos: true,
          },
        },
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { message: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const cocinaBoleta = {
      PedidoID: pedido.PedidoID,
      Fecha: pedido.Fecha,
      Platos: pedido.detallepedidos.map((detalle) => ({
        Producto: detalle.platos?.Descripcion || "Producto desconocido",
        Cantidad: detalle.Cantidad,
      })),
    };

    return NextResponse.json(cocinaBoleta);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al obtener el pedido", error },
      { status: 500 }
    );
  }
}
