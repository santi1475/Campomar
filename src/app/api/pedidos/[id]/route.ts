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

  try {
    const { EmpleadoID, Fecha, Total, Estado, TipoPago } =
      await putSchema.validate(await request.json());

    const updatedPedido = await prisma.pedidos.update({
      where: {
        PedidoID: pedidoId,
      },
      data: {
        EmpleadoID,
        Fecha,
        Total,
        Estado,
        TipoPago,
      },
    });

    // =================== LÓGICA PARA LIBERAR MESAS ===================
    // Si el pedido se ha marcado como inactivo (pagado), liberamos las mesas.
    if (Estado === false) {
      await prisma.$transaction(async (tx) => {
        // 1. Encontrar todas las relaciones pedido-mesa para este pedido.
        const pedidoMesas = await tx.pedido_mesas.findMany({
          where: {
            PedidoID: pedidoId,
          },
        });

        // 2. Obtener los IDs de todas las mesas asociadas.
        const mesaIds = pedidoMesas.map((pm) => pm.MesaID);

        // 3. Actualizar el estado de todas esas mesas a "Libre".
        if (mesaIds.length > 0) {
          await tx.mesas.updateMany({
            where: {
              MesaID: {
                in: mesaIds.filter((id): id is number => id !== null),
              },
            },
            data: {
              Estado: "Libre",
            },
          });
        }
      });
    }
    // =================== FIN DE LA LÓGICA ===================

    return NextResponse.json(updatedPedido);
  } catch (error) {
    console.error("Error al actualizar el pedido:", error);
    return NextResponse.json(error, { status: 400 });
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
      // 1. Eliminar los detalles del pedido
      await tx.detallepedidos.deleteMany({
        where: { PedidoID: pedidoId },
      });

      // 2. Obtener y eliminar las relaciones pedido-mesas
      const pedidoMesas = await tx.pedido_mesas.findMany({
        where: { PedidoID: pedidoId },
      });
      const mesaIds = pedidoMesas.map((pm) => pm.MesaID);
      
      await tx.pedido_mesas.deleteMany({
        where: { PedidoID: pedidoId },
      });

      // 3. Liberar las mesas
      if (mesaIds.length > 0) {
        await tx.mesas.updateMany({
          where: {
            MesaID: { in: mesaIds.filter((id): id is number => id !== null) },
          },
          data: { Estado: "Libre" },
        });
      }

      // 4. Finalmente eliminar el pedido
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
