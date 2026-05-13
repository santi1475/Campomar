import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { MesaEstado, PedidoEstado, Prisma } from "@prisma/client";
import {
  CancelarPedidoSchema,
  UpdatePedidoSchema,
  parseJson,
} from "@/app/api/_lib/dto";

interface Segments {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: Segments) {
  const pedidoId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(pedidoId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  const pedido = await prisma.pedidos.findUnique({
    where: { PedidoID: pedidoId },
    include: { empleados: true },
  });

  if (!pedido) {
    return NextResponse.json({ message: "Pedido no encontrado" }, { status: 404 });
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
  Estado: yup.mixed<'Activo' | 'Cerrado'>().oneOf(['Activo', 'Cerrado']).optional(),
  TipoPago: yup.number().optional(),
});

  const parsed = await parseJson(request, UpdatePedidoSchema);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.message, details: parsed.details },
      { status: parsed.status }
    );
  }

  const data = parsed.data;

  try {
    const existingPedido = await prisma.pedidos.findUnique({
      where: { PedidoID: pedidoId },
      include: { pedido_mesas: true },
    });

    if (!existingPedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updateData: Prisma.pedidosUpdateInput = {};
      if (data.EmpleadoID !== undefined) {
        updateData.empleados = { connect: { EmpleadoID: data.EmpleadoID } };
      }
      if (data.Fecha !== undefined) updateData.Fecha = data.Fecha;
      if (data.Total !== undefined) updateData.Total = data.Total;
      if (data.Estado !== undefined) updateData.Estado = data.Estado;
      if (data.TipoPago !== undefined) {
        updateData.tipopago =
          data.TipoPago === null
            ? { disconnect: true }
            : { connect: { TipoPagoID: data.TipoPago } };
      }

      const updatedPedido = await tx.pedidos.update({
        where: { PedidoID: pedidoId },
        data: updateData,
      });

      console.log("API: Pedido actualizado:", updatedPedido);

      if (Estado === 'Cerrado') {
        console.log("API: Liberando mesas asociadas al pedido");

        const mesaIds = existingPedido.pedido_mesas.map((pm) => pm.MesaID);

        if (mesaIds.length > 0) {
          await tx.mesas.updateMany({
            where: { MesaID: { in: mesaIds } },
            data: { Estado: MesaEstado.Libre },
          });
        }
      }

      return updatedPedido;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Pedido actualizado correctamente",
    });
  } catch (error) {
    console.error("[API pedidos/[id] PUT] error", error);
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

export async function DELETE(request: NextRequest, { params }: Segments) {
  const pedidoId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(pedidoId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  const parsed = await parseJson(request, CancelarPedidoSchema);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.message, details: parsed.details },
      { status: parsed.status }
    );
  }
  const { usuarioCanceladorId } = parsed.data;

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
    const fechaCreacion = pedido.Fecha ? new Date(pedido.Fecha) : ahora;
    const tiempoTranscurrido = Math.floor(
      (ahora.getTime() - fechaCreacion.getTime()) / 60000
    );

    const nivelAlerta =
      tiempoTranscurrido > 40
        ? "ALTO"
        : tiempoTranscurrido > 20
        ? "MEDIO"
        : "BAJO";

    const detallesSnapshot = {
      total: Number(pedido.Total),
      mozoCreador: pedido.empleados?.Nombre,
      mesas: pedido.pedido_mesas
        .map((pm) => pm.mesas?.NumeroMesa)
        .filter((n): n is number => typeof n === "number"),
      detalles: pedido.detallepedidos.map((d) => ({
        plato: d.platos?.Descripcion,
        cantidad: d.Cantidad,
        precioUnitario: d.PrecioUnitario,
      })),
    };

    await prisma.$transaction(async (tx) => {
      await tx.auditoria.create({
        data: {
          accion: "CANCELACION_PEDIDO",
          pedidoId: pedido.PedidoID,
          usuarioId: usuarioCanceladorId,
          detalles: detallesSnapshot,
          fechaCreacion: pedido.Fecha ?? ahora,
          fechaAccion: ahora,
          tiempoTranscurrido,
          nivelAlerta,
          justificacion: null,
        },
      });

      const mesaIds = pedido.pedido_mesas
        .map((pm) => pm.MesaID)
        .filter((id): id is number => id !== null);
      if (mesaIds.length > 0) {
        await tx.mesas.updateMany({
          where: { MesaID: { in: mesaIds } },
          data: { Estado: MesaEstado.Libre },
        });
      }

      await tx.comandas_cocina.deleteMany({ where: { PedidoID: pedidoId } });
      await tx.detallepedidos.deleteMany({ where: { PedidoID: pedidoId } });
      await tx.pedido_mesas.deleteMany({ where: { PedidoID: pedidoId } });
      await tx.auditoria_eliminaciones.deleteMany({ where: { PedidoID: pedidoId } });
      await tx.pedidos.delete({ where: { PedidoID: pedidoId } });
    });

    return NextResponse.json({
      message: "Pedido cancelado y auditado correctamente",
    });
  } catch (error) {
    console.error("[API pedidos/[id] DELETE] error", error);
    return NextResponse.json(
      { message: "Error al eliminar el pedido", error: String(error) },
      { status: 500 }
    );
  }
}
