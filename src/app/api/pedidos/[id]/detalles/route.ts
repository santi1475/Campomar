import { NextResponse } from "next/server";
import prisma from "@/lib/db";

interface Segments {
  params: { id: string };
}

// GET /api/pedidos/:id/detalles
export async function GET(_req: Request, { params }: Segments) {
  const pedidoId = Number(params.id);
  if (!pedidoId) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }
  try {
    const detalles = await prisma.detallepedidos.findMany({
      where: { PedidoID: pedidoId },
      include: { platos: { select: { Descripcion: true, Precio: true, PrecioLlevar: true, PlatoID: true } } },
      orderBy: { DetalleID: 'asc' }
    });
    return NextResponse.json(detalles.map(d => ({
      DetalleID: d.DetalleID,
      PlatoID: d.PlatoID,
      Cantidad: d.Cantidad,
      Impreso: d.Impreso,
      Descripcion: d.platos?.Descripcion ?? '',
      Precio: d.platos?.Precio ?? 0,
      PrecioLlevar: d.platos?.PrecioLlevar ?? 0,
      PrecioUnitario: d.PrecioUnitario ?? 0
    })));
  } catch (e) {
    console.error("Error listando detalles por pedido", e);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
