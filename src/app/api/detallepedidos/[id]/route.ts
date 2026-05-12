import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import {
  DeleteDetalleSchema,
  UpdateDetallePedidoSchema,
  parseJson,
} from "@/app/api/_lib/dto";

interface Segments {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: Segments) {
  const detalleId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(detalleId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  const detallePedido = await prisma.detallepedidos.findUnique({
    where: { DetalleID: detalleId },
  });

  if (!detallePedido) {
    return NextResponse.json(
      { message: "Detalle de pedido no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(detallePedido);
}

export async function PUT(request: NextRequest, { params }: Segments) {
  const detalleId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(detalleId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  const detallePedido = await prisma.detallepedidos.findFirst({
    where: { DetalleID: detalleId },
    include: {
      platos: true,
      pedidos: { include: { pedido_mesas: true } },
    },
  });

  if (!detallePedido) {
    return NextResponse.json(
      { message: "Detalle de pedido no encontrado" },
      { status: 404 }
    );
  }

  const parsed = await parseJson(request, UpdateDetallePedidoSchema);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.message, details: parsed.details },
      { status: parsed.status }
    );
  }
  const { PlatoID, Cantidad, operacion, cantidad, usuarioId } = parsed.data;

  try {
    const cantidadOriginal = detallePedido.Cantidad;
    let nuevaCantidad = detallePedido.Cantidad;

    if (Cantidad !== undefined) {
      nuevaCantidad = Cantidad;
    } else if (operacion === "incrementar") {
      nuevaCantidad += cantidad ?? 1;
    } else if (operacion === "decrementar") {
      nuevaCantidad = Math.max(nuevaCantidad - 1, 1);
    }

    const cantidadEliminada = cantidadOriginal - nuevaCantidad;
    const huboDisminucion = cantidadEliminada > 0;
    const precioUnitarioActual = detallePedido.PrecioUnitario ?? 0;

    const updatedDetallePedido = await prisma.$transaction(async (tx) => {
      if (huboDisminucion && detallePedido.Impreso && usuarioId) {
        const mesaID = detallePedido.pedidos.pedido_mesas[0]?.MesaID ?? null;

        await tx.auditoria_eliminaciones.create({
          data: {
            EmpleadoID: usuarioId,
            PedidoID: detallePedido.PedidoID,
            MesaID: mesaID,
            DescripcionPlato: detallePedido.platos?.Descripcion ?? "Desconocido",
            CantidadEliminada: cantidadEliminada,
            PrecioUnitario: precioUnitarioActual,
            TotalPerdido: Number(precioUnitarioActual) * cantidadEliminada,
            EstabaImpreso: true,
            TipoAccion: "REDUCCION_CANTIDAD",
          },
        });
      }

      const updated = await tx.detallepedidos.update({
        where: { DetalleID: detalleId },
        data: {
          PlatoID,
          Cantidad: nuevaCantidad,
          Impreso: false,
        },
      });

      const pedido = await tx.pedidos.findUnique({
        where: { PedidoID: detallePedido.PedidoID },
        select: { ParaLlevar: true },
      });
      const esParaLlevar = pedido?.ParaLlevar === true;

      const detalles = await tx.detallepedidos.findMany({
        where: { PedidoID: detallePedido.PedidoID },
        include: { platos: true },
      });

      const nuevoTotal = detalles.reduce((acc, detalle) => {
        const base = detalle.platos.Precio ? detalle.platos.Precio.toNumber() : 0;
        const alt = detalle.platos.PrecioLlevar
          ? Number(detalle.platos.PrecioLlevar)
          : 0;
        const precio = esParaLlevar && alt > 0 ? alt : base;
        return acc + detalle.Cantidad * precio;
      }, 0);

      await tx.pedidos.update({
        where: { PedidoID: detallePedido.PedidoID },
        data: { Total: nuevoTotal },
      });

      return updated;
    });

    return NextResponse.json(updatedDetallePedido);
  } catch (error) {
    return NextResponse.json(
      { message: "Error al actualizar detalle", error: String(error) },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Segments) {
  const detalleId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(detalleId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  const detalle = await prisma.detallepedidos.findUnique({
    where: { DetalleID: detalleId },
    include: {
      platos: true,
      pedidos: { include: { pedido_mesas: true } },
    },
  });

  if (!detalle) {
    return NextResponse.json(
      { message: "Detalle de pedido no encontrado" },
      { status: 404 }
    );
  }

  const parsed = await parseJson(request, DeleteDetalleSchema);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.message, details: parsed.details },
      { status: parsed.status }
    );
  }
  const { usuarioId } = parsed.data;
  const precioUnitarioActual = detalle.PrecioUnitario ?? 0;

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (detalle.Impreso && usuarioId) {
        const mesaID = detalle.pedidos.pedido_mesas[0]?.MesaID ?? null;

        await tx.auditoria_eliminaciones.create({
          data: {
            EmpleadoID: usuarioId,
            PedidoID: detalle.PedidoID,
            MesaID: mesaID,
            DescripcionPlato: detalle.platos?.Descripcion ?? "Desconocido",
            CantidadEliminada: detalle.Cantidad,
            PrecioUnitario: precioUnitarioActual,
            TotalPerdido: Number(precioUnitarioActual) * detalle.Cantidad,
            EstabaImpreso: true,
            TipoAccion: "ELIMINACION_TOTAL",
          },
        });
      }

      const deletedDetalle = await tx.detallepedidos.delete({
        where: { DetalleID: detalleId },
      });

      const pedido = await tx.pedidos.findUnique({
        where: { PedidoID: detalle.PedidoID },
        select: { ParaLlevar: true },
      });
      const esParaLlevar = pedido?.ParaLlevar === true;

      const detallesRestantes = await tx.detallepedidos.findMany({
        where: { PedidoID: detalle.PedidoID },
        include: { platos: true },
      });

      const nuevoTotal = detallesRestantes.reduce((acc, det) => {
        const base = det.platos.Precio ? det.platos.Precio.toNumber() : 0;
        const alt = det.platos.PrecioLlevar ? Number(det.platos.PrecioLlevar) : 0;
        const precio = esParaLlevar && alt > 0 ? alt : base;
        return acc + det.Cantidad * precio;
      }, 0);

      await tx.pedidos.update({
        where: { PedidoID: detalle.PedidoID },
        data: { Total: nuevoTotal },
      });

      return deletedDetalle;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API detallepedidos/[id] DELETE] error", error);
    return NextResponse.json(
      { message: "Error al eliminar el detalle del pedido" },
      { status: 500 }
    );
  }
}
