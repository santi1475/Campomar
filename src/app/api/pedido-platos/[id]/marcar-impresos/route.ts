import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pedidoId = parseInt(params.id);
    const { detalleIds } = await request.json();

    if (!pedidoId || !detalleIds || !Array.isArray(detalleIds) || detalleIds.length === 0) {
      return NextResponse.json(
        { message: "ID de pedido o detalles no válidos" },
        { status: 400 }
      );
    }

    // Actualizar solo los detalles especificados como impresos
    const updateResult = await prisma.detallepedidos.updateMany({
      where: {
        PedidoID: parseInt(params.id),
        DetalleID: {
          in: detalleIds,
        },
      },
      data: {
        Impreso: true,
      },
    });

    // Log para depuración: mostrar los detalles actualizados
    const detallesActualizados = await prisma.detallepedidos.findMany({
      where: {
        PedidoID: parseInt(params.id),
        DetalleID: {
          in: detalleIds,
        },
      },
    });
    console.log("Detalles marcados como impresos:", detallesActualizados);

    return NextResponse.json({ message: "Detalles marcados como impresos", detallesActualizados, updateResult });
  } catch (error) {
    console.error("Error al marcar platos como impresos:", error);
    return NextResponse.json(
      { message: "Error al marcar platos como impresos" },
      { status: 500 }
    );
  }
}
