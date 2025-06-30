import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const pedidos = await prisma.pedidos.findMany({
      where: {
        Estado: true, // Solo pedidos activos
      },
      include: {
        detallepedidos: {
          include: {
            platos: true, // Incluye información de los platos
          },
        },
        pedido_mesas: {
          include: {
            mesas: true, // Incluye información de las mesas relacionadas
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: pedidos });
  } catch (error) {
    console.error("Error al obtener los pedidos:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener los pedidos." },
      { status: 500 }
    );
  }
}
