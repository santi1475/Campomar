import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest, res: NextResponse) {
  const { searchParams } = new URL(req.url);
  const mesaId = searchParams.get("mesaId");

  if (!mesaId) {
    return NextResponse.json(
      { message: "No se proporcionó un MesaID" },
      { status: 400 }
    );
  }

  try {
    // Obtener el PedidoID de la mesa seleccionada
    const mesa = await prisma.pedido_mesas.findFirst({
      where: {
        MesaID: Number(mesaId),
      },
    });

    if (!mesa) {
      return NextResponse.json(
        { message: "Mesa no encontrada" },
        { status: 404 }
      );
    }

    const { PedidoID } = mesa;

    // Obtener todas las mesas relacionadas con el PedidoID
    const mesasRelacionadas = await prisma.pedido_mesas.findMany({
      where: {
        PedidoID: PedidoID,
      },
      include: {
        mesas: true, // Incluye la información de la mesa
      },
    });

    return NextResponse.json(mesasRelacionadas);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Error al obtener las mesas relacionadas",
      },
      { status: 500 }
    );
  }
}
