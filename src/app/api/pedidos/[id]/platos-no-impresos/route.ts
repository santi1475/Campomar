import prisma from "@/lib/db";
import { NextResponse } from "next/server";

interface Segments {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: Segments) {
  try {
    const { id } = params;
    const pedidoId = parseInt(id);

    if (isNaN(pedidoId)) {
      return NextResponse.json(
        { message: "ID de pedido inválido" },
        { status: 400 }
      );
    }

    // Verificar que el pedido existe
    const pedido = await prisma.pedidos.findUnique({
      where: { PedidoID: pedidoId }
    });

    if (!pedido) {
      return NextResponse.json(
        { message: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // Obtener solo los platos no impresos del pedido
    const platosNoImpresos = await prisma.detallepedidos.findMany({
      where: {
        PedidoID: pedidoId,
        Impreso: false
      },
      include: {
        platos: {
          include: {
            categorias: true
          }
        }
      },
      orderBy: {
        DetalleID: 'asc'
      }
    });

    const response = {
      pedidoID: pedidoId,
      cantidadPlatosNoImpresos: platosNoImpresos.length,
      platos: platosNoImpresos.map(detalle => ({
        DetalleID: detalle.DetalleID,
        PlatoID: detalle.PlatoID,
        Cantidad: detalle.Cantidad,
        Descripcion: detalle.platos?.Descripcion || "Sin descripción",
        Precio: detalle.platos?.Precio || 0,
        Categoria: detalle.platos?.categorias?.Descripcion || "Sin categoría"
      }))
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error al obtener platos no impresos:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}