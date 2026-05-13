import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { PedidoEstado } from "@prisma/client";

export async function GET() {
  try {
    const pedidos = await prisma.pedidos.findMany({
      where: { Estado: PedidoEstado.Activo },
      include: {
        detallepedidos: { include: { platos: true } },
        pedido_mesas: { include: { mesas: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: pedidos },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("API pedido-platos GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener los pedidos.",
        errorDetails: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
