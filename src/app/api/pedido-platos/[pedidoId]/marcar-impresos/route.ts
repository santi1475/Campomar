import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

interface Segments {
  params: { pedidoId: string };
}

// PUT /api/pedido-platos/:pedidoId/marcar-impresos
// Body: { detalleIds: number[] }
export async function PUT(req: NextRequest, { params }: Segments) {
  try {
    const { pedidoId } = params;
    const { detalleIds } = await req.json();

    if (!Array.isArray(detalleIds) || !detalleIds.length) {
      return NextResponse.json({ message: "detalleIds requerido" }, { status: 400 });
    }

    const pedidoIDNum = Number(pedidoId);
    if (!pedidoIDNum) {
      return NextResponse.json({ message: "pedidoId inválido" }, { status: 400 });
    }

    // Verificar que los detalles pertenecen al pedido
    const detalles = await prisma.detallepedidos.findMany({
      where: { DetalleID: { in: detalleIds }, PedidoID: pedidoIDNum },
      select: { DetalleID: true },
    });

    if (!detalles.length) {
      return NextResponse.json({ message: "No se encontraron detalles para actualizar" }, { status: 404 });
    }

    await prisma.detallepedidos.updateMany({
      where: { DetalleID: { in: detalles.map(d => d.DetalleID) } },
      data: { Impreso: true },
    });

    return NextResponse.json({ updated: detalles.length });
  } catch (error) {
    console.error("Error marcando detalles impresos", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
