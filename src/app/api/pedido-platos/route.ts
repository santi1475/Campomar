import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { PedidoEstado } from "@prisma/client";

export async function GET() {
  try {
    console.log('API: Iniciando búsqueda de pedidos activos');
    
    try {
      await prisma.$connect();
      console.log('API: Conexión a la base de datos establecida');
    } catch (error) {
      console.error('API: Error al conectar con la base de datos:', error);
      throw error;
    }

    const todosLosPedidos = await prisma.pedidos.findMany();
    console.log(`API: Total de pedidos encontrados: ${todosLosPedidos.length}`);
    console.log('API: Muestra de pedidos:', todosLosPedidos.slice(0, 2));

    const pedidosActivos = await prisma.pedidos.findMany({
      where: {
        Estado: 'Activo',
      },
    });
    console.log(`API: Pedidos activos encontrados: ${pedidosActivos.length}`);
    console.log('API: Muestra de pedidos activos:', pedidosActivos.slice(0, 2));

    const pedidos = await prisma.pedidos.findMany({
      where: {
        Estado: 'Activo',
      },
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
