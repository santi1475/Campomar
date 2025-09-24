import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pedidoId = parseInt(params.id);
    const { platosIds } = await request.json();

    if (!pedidoId || !platosIds || !Array.isArray(platosIds)) {
      return NextResponse.json(
        { message: "ID de pedido o platos no válidos" },
        { status: 400 }
      );
    }

    // Actualizar todos los detalles del pedido especificados como impresos
    await prisma.detallepedidos.updateMany({
      where: {
        PedidoID: pedidoId,
        PlatoID: {
          in: platosIds,
        },
      },
      data: {
        Impreso: true,
      },
    });

    return NextResponse.json({ message: "Platos marcados como impresos" });
  } catch (error) {
    console.error("Error al marcar platos como impresos:", error);
    return NextResponse.json(
      { message: "Error al marcar platos como impresos" },
      { status: 500 }
    );
  }
}
