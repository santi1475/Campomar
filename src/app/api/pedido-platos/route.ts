import prisma from "@/lib/db";
import { NextResponse } from "next/server";

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
        Estado: true, 
      },
    });
    console.log(`API: Pedidos activos encontrados: ${pedidosActivos.length}`);
    console.log('API: Muestra de pedidos activos:', pedidosActivos.slice(0, 2));

    const pedidos = await prisma.pedidos.findMany({
      where: {
        Estado: true, 
      },
      include: {
        detallepedidos: {
          include: {
            platos: true,
          },
        },
        pedido_mesas: {
          include: {
            mesas: true,
          },
        },
      },
    });

    console.log(`API: Pedidos con detalles encontrados: ${pedidos.length}`);
    
    if (pedidos.length > 0) {
      const primerPedido = pedidos[0];
      console.log('API: Detalles del primer pedido:', {
        PedidoID: primerPedido.PedidoID,
        Estado: primerPedido.Estado,
        NumeroDetalles: primerPedido.detallepedidos.length,
        NumeroMesas: primerPedido.pedido_mesas.length,
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: pedidos,
      debug: {
        totalPedidos: todosLosPedidos.length,
        pedidosActivos: pedidosActivos.length,
        pedidosConDetalles: pedidos.length
      }
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error("API: Error detallado al obtener los pedidos:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Error al obtener los pedidos.",
        errorDetails: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
