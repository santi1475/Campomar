import prisma from "@/lib/db";
import { de } from "date-fns/locale";
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
    include: {
      empleados: true,
    },
  });

  if (!pedido) {
    return NextResponse.json(
      { message: "Pedido no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ...pedido,
    MozoNombre: pedido.empleados?.Nombre || null,
  });
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

  console.log("API: Iniciando actualización de pedido:", pedidoId);

  try {
    const body = await request.json();
    console.log("API: Datos recibidos:", body);

    const { EmpleadoID, Fecha, Total, Estado, TipoPago } =
      await putSchema.validate(body);

    console.log("API: Datos validados:", {
      EmpleadoID,
      Fecha,
      Total,
      Estado,
      TipoPago,
    });

    const existingPedido = await prisma.pedidos.findUnique({
      where: { PedidoID: pedidoId },
      include: {
        pedido_mesas: true,
      },
    });

    if (!existingPedido) {
      console.log("API: Pedido no encontrado:", pedidoId);
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

      console.log("API: Pedido actualizado:", updatedPedido);

      if (Estado === false) {
        console.log("API: Liberando mesas asociadas al pedido");

        const mesaIds = existingPedido.pedido_mesas.map((pm) => pm.MesaID);

        if (mesaIds.length > 0) {
          const mesasActualizadas = await tx.mesas.updateMany({
            where: {
              MesaID: {
                in: mesaIds.filter((id): id is number => id !== null),
              },
            },
            data: { Estado: "Libre" },
          });

          console.log("API: Mesas actualizadas:", mesasActualizadas);
        }
      }

      return updatedPedido;
    });

    console.log("API: Transacción completada exitosamente");

    return NextResponse.json({
      success: true,
      data: result,
      message: "Pedido actualizado correctamente",
    });
  } catch (error) {
    console.error("API: Error al actualizar el pedido:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al actualizar el pedido",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: Segments) {
  const { id } = params;
  const pedidoId = parseInt(id);

  let usuarioCanceladorId: number | undefined;
  try {
    const body = await request.json();
    usuarioCanceladorId = body?.usuarioCanceladorId;
  } catch (err) {
    console.warn('API DELETE: request.json() falló o body vacío/no JSON válido', err);
    usuarioCanceladorId = undefined;
  }

  if (!usuarioCanceladorId) {
    return NextResponse.json(
      { message: "Se requiere identificar al usuario que cancela." },
      { status: 400 }
    );
  }

  try {
    const pedido = await prisma.pedidos.findUnique({
      where: { PedidoID: pedidoId },
      include: {
        detallepedidos: { include: { platos: true } },
        empleados: true,
        pedido_mesas: { include: { mesas: true } },
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { message: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const ahora = new Date();
    const fechaCreacion = new Date(pedido.Fecha!);
    const tiempoTranscurrido = Math.floor(
      (ahora.getTime() - fechaCreacion.getTime()) / 60000
    ); // en minutos

    let nivelAlerta: string;
    if (tiempoTranscurrido > 40) {
      nivelAlerta = "ALTO";
    } else if (tiempoTranscurrido > 20) {
      nivelAlerta = "MEDIO";
    } else {
      nivelAlerta = "BAJO";
    }

    const detallesSnapshot = {
      total: Number(pedido.Total),
      mozoCreador: pedido.empleados?.Nombre,
      mesas: pedido.pedido_mesas.map((pm) => pm.mesas?.NumeroMesa).filter((num): num is number => num !== undefined),
      detalles: pedido.detallepedidos.map((d) => ({
        plato: d.platos?.Descripcion,
        cantidad: d.Cantidad,
        precioUnitario: d.PrecioUnitario,
      })),
    };

    await prisma.$transaction(async (tx) => {
      // 1. Crear registro de auditoría general de la cancelación
      await tx.auditoria.create({
        data: {
          accion: "CANCELACION_PEDIDO",
          pedidoId: pedido.PedidoID,
          usuarioId: usuarioCanceladorId,
          detalles: detallesSnapshot,
          fechaCreacion: pedido.Fecha!,
          fechaAccion: ahora,
          tiempoTranscurrido: tiempoTranscurrido,
          nivelAlerta: nivelAlerta,
          justificacion: null,
        },
      });

      // 2. Liberar las mesas
      const mesaIds = pedido.pedido_mesas
        .map((pm) => pm.MesaID)
        .filter((id): id is number => id !== null);
      if (mesaIds.length > 0) {
        await tx.mesas.updateMany({
          where: { MesaID: { in: mesaIds } },
          data: { Estado: "Libre" },
        });
      }
      

      // 3. Eliminar todos los registros dependientes
      await tx.comandas_cocina.deleteMany({ where: { PedidoID: pedidoId } });
      await tx.detallepedidos.deleteMany({ where: { PedidoID: pedidoId } });
      await tx.pedido_mesas.deleteMany({ where: { PedidoID: pedidoId } });

      // 🔥 AGREGAR ESTA LÍNEA: Eliminar auditorías de eliminaciones previas de este pedido
      await tx.auditoria_eliminaciones.deleteMany({ where: { PedidoID: pedidoId } });

      // 4. Finalmente, eliminar el pedido
      await tx.pedidos.delete({ where: { PedidoID: pedidoId } });
    });

    return NextResponse.json({
      message: "Pedido cancelado y auditado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar el pedido:", error);
    return NextResponse.json(
      { message: "Error al eliminar el pedido", error: String(error) },
      { status: 500 }
    );
  }
}
