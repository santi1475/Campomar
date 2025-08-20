import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import * as yup from "yup";

interface Segments {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: Segments) {
  const { id } = params;

  const pedido = await prisma.pedidos.findUnique({
    where: {
      PedidoID: parseInt(id),
    },
  });

  if (!pedido) {
    return NextResponse.json(
      { message: "Pedido no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(pedido);
}

const putSchema = yup.object({
  EmpleadoID: yup.number().optional(),
  Fecha: yup.date().optional(),
  Total: yup.number().optional(),
  Estado: yup.boolean().optional(),
  TipoPago: yup.number().optional(),
});

export async function PUT(request: Request, { params }: Segments) {
  const { id } = params;
  const pedidoId = parseInt(id);

  console.log('API: Iniciando actualización de pedido:', pedidoId);

  try {
    const body = await request.json();
    console.log('API: Datos recibidos:', body);

    const { EmpleadoID, Fecha, Total, Estado, TipoPago } =
      await putSchema.validate(body);

    console.log('API: Datos validados:', { EmpleadoID, Fecha, Total, Estado, TipoPago });

    const existingPedido = await prisma.pedidos.findUnique({
      where: { PedidoID: pedidoId },
      include: {
        pedido_mesas: true
      }
    });

    if (!existingPedido) {
      console.log('API: Pedido no encontrado:', pedidoId);
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedPedido = await tx.pedidos.update({
        where: { PedidoID: pedidoId },
        data: {
          EmpleadoID,
          Fecha,
          Total,
          Estado,
          TipoPago,
        },
      });

      console.log('API: Pedido actualizado:', updatedPedido);

      if (Estado === false) {
        console.log('API: Liberando mesas asociadas al pedido');
        
        const mesaIds = existingPedido.pedido_mesas.map(pm => pm.MesaID);
        
        if (mesaIds.length > 0) {
          const mesasActualizadas = await tx.mesas.updateMany({
            where: {
              MesaID: {
                in: mesaIds.filter((id): id is number => id !== null),
              },
            },
            data: { Estado: "Libre" },
          });
          
          console.log('API: Mesas actualizadas:', mesasActualizadas);
        }
      }

      return updatedPedido;
    });

    console.log('API: Transacción completada exitosamente');
    
    return NextResponse.json({
      success: true,
      data: result,
      message: "Pedido actualizado correctamente"
    });

  } catch (error) {
    console.error("API: Error al actualizar el pedido:", error);
    return NextResponse.json({
      success: false,
      error: "Error al actualizar el pedido",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: Segments) {
  const { id } = params;
  const pedidoId = parseInt(id);

  const pedido = await prisma.pedidos.findFirst({
    where: {
      PedidoID: pedidoId,
    },
  });

  if (!pedido) {
    return NextResponse.json(
      { message: "Pedido no encontrado" },
      { status: 404 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.detallepedidos.deleteMany({
        where: { PedidoID: pedidoId },
      });

      const pedidoMesas = await tx.pedido_mesas.findMany({
        where: { PedidoID: pedidoId },
      });
      const mesaIds = pedidoMesas.map((pm) => pm.MesaID);
      
      await tx.pedido_mesas.deleteMany({
        where: { PedidoID: pedidoId },
      });

      if (mesaIds.length > 0) {
        await tx.mesas.updateMany({
          where: {
            MesaID: { in: mesaIds.filter((id): id is number => id !== null) },
          },
          data: { Estado: "Libre" },
        });
      }

      const deletedPedido = await tx.pedidos.delete({
        where: {
          PedidoID: pedidoId,
        },
      });

      return deletedPedido;
    });

    return NextResponse.json({ message: "Pedido eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el pedido:", error);
    return NextResponse.json(
      { message: "Error al eliminar el pedido" }, 
      { status: 500 }
    );
  }
}
