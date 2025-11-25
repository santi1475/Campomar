import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import * as yup from "yup";

interface Segments {
  params: {
    id: string;
  };
}

// ==================== GET ====================
export async function GET(request: Request, { params }: Segments) {
  const { id } = params;

  const detallePedido = await prisma.detallepedidos.findUnique({
    where: {
      DetalleID: parseInt(id),
    },
  });

  if (!detallePedido) {
    return NextResponse.json(
      { message: "Detalle de pedido no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(detallePedido);
}

// ==================== PUT ====================
const putSchema = yup.object({
  PlatoID: yup.number().optional(),
  Cantidad: yup.number().optional(),
  operacion: yup.string().oneOf(["incrementar", "decrementar"]).optional(),
  cantidad: yup.number().optional(),
  usuarioId: yup.number().optional(), // Opcional para compatibilidad
});

export async function PUT(request: Request, { params }: Segments) {
  const { id } = params;

  const detallePedido = await prisma.detallepedidos.findFirst({
    where: {
      DetalleID: parseInt(id),
    },
    include: {
      platos: true,
      pedidos: {
        include: {
          pedido_mesas: true,
        }
      }
    },
  });

  if (!detallePedido) {
    return NextResponse.json(
      { message: "Detalle de pedido no encontrado" },
      { status: 404 }
    );
  }

  try {
    let body: any;
    try {
      body = await request.json();
    } catch (err) {
      console.warn('PUT /api/detallepedidos/[id]: request.json() falló o body vacío/no JSON válido', err);
      return NextResponse.json({ message: 'Se requiere un cuerpo JSON válido' }, { status: 400 });
    }

    const { PlatoID, Cantidad, operacion, cantidad, usuarioId } = await putSchema.validate(body);

    const cantidadOriginal = detallePedido.Cantidad;
    let nuevaCantidad = detallePedido.Cantidad;

    if (Cantidad !== undefined) {
      nuevaCantidad = Cantidad;
    } else if (operacion === "incrementar") {
      // Si se especifica una cantidad, incrementar por esa cantidad, sino por 1
      const incremento = cantidad || 1;
      nuevaCantidad += incremento;
    } else if (operacion === "decrementar") {
      nuevaCantidad = Math.max(nuevaCantidad - 1, 1);
    }

    // Calcular si hubo disminución
    const cantidadEliminada = cantidadOriginal - nuevaCantidad;
    const huboDisminucion = cantidadEliminada > 0;

    const updatedDetallePedido = await prisma.$transaction(async (tx) => {
      
      // A) Auditar si hubo disminución Y estaba impreso Y hay usuarioId
      if (huboDisminucion && detallePedido.Impreso && usuarioId) {
        const mesaID = detallePedido.pedidos.pedido_mesas[0]?.MesaID || null;
        
        await tx.auditoria_eliminaciones.create({
          data: {
            EmpleadoID: usuarioId,
            PedidoID: detallePedido.PedidoID,
            MesaID: mesaID,
            DescripcionPlato: detallePedido.platos?.Descripcion || "Desconocido",
            CantidadEliminada: cantidadEliminada,
            PrecioUnitario: detallePedido.PrecioUnitario,
            TotalPerdido: Number(detallePedido.PrecioUnitario) * cantidadEliminada,
            EstabaImpreso: true,
            TipoAccion: "REDUCCION_CANTIDAD"
          }
        });
      }

      // B) Actualizar el detalle
      const updated = await tx.detallepedidos.update({
        where: {
          DetalleID: parseInt(id),
        },
        data: {
          PlatoID,
          Cantidad: nuevaCantidad,
          Impreso: false,
        },
      });

      // C) Obtener tipo de pedido
      const pedido = await tx.pedidos.findUnique({
        where: { PedidoID: detallePedido.PedidoID },
        select: { ParaLlevar: true },
      });

      const esParaLlevar = pedido?.ParaLlevar === true;

      // D) Recalcular total
      const detalles = await tx.detallepedidos.findMany({
        where: { PedidoID: detallePedido.PedidoID },
        include: { platos: true },
      });

      const nuevoTotal = detalles.reduce((acc, detalle) => {
        const base = detalle.platos.Precio ? detalle.platos.Precio.toNumber() : 0;
        const alt = detalle.platos.PrecioLlevar ? Number(detalle.platos.PrecioLlevar) : 0;
        const precio = esParaLlevar && alt > 0 ? alt : base;
        return acc + detalle.Cantidad * precio;
      }, 0);

      // E) Actualizar total del pedido
      await tx.pedidos.update({
        where: { PedidoID: detallePedido.PedidoID },
        data: { Total: nuevoTotal },
      });

      return updated;
    });

    return NextResponse.json(updatedDetallePedido);
  } catch (error) {
    return NextResponse.json(error, { status: 400 });
  }
}

// ==================== DELETE ====================
export async function DELETE(request: Request, { params }: Segments) {
  const { id } = params;

  const detalle = await prisma.detallepedidos.findUnique({
    where: { DetalleID: parseInt(id) },
    include: {
      platos: true,
      pedidos: {
        include: {
          pedido_mesas: true,
        }
      }
    },
  });

  if (!detalle) {
    return NextResponse.json(
      { message: "Detalle de pedido no encontrado" },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const usuarioSolicitante = body.usuarioId;

    const result = await prisma.$transaction(async (tx) => {
      
      // A) Auditar si estaba impreso
      if (detalle.Impreso && usuarioSolicitante) {
        const mesaID = detalle.pedidos.pedido_mesas[0]?.MesaID || null;
        
        await tx.auditoria_eliminaciones.create({
          data: {
            EmpleadoID: usuarioSolicitante,
            PedidoID: detalle.PedidoID,
            MesaID: mesaID,
            DescripcionPlato: detalle.platos?.Descripcion || "Desconocido",
            CantidadEliminada: detalle.Cantidad,
            PrecioUnitario: detalle.PrecioUnitario,
            TotalPerdido: Number(detalle.PrecioUnitario) * detalle.Cantidad,
            EstabaImpreso: true,
            TipoAccion: "ELIMINACION_TOTAL"
          }
        });
      }

      // B) Eliminar el detalle
      const deletedDetalle = await tx.detallepedidos.delete({
        where: { DetalleID: parseInt(id) }
      });

      // C) Obtener tipo de pedido
      const pedido = await tx.pedidos.findUnique({
        where: { PedidoID: detalle.PedidoID },
        select: { ParaLlevar: true },
      });

      const esParaLlevar = pedido?.ParaLlevar === true;

      // D) Recalcular total
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

      // E) Actualizar total del pedido
      await tx.pedidos.update({
        where: { PedidoID: detalle.PedidoID },
        data: { Total: nuevoTotal },
      });

      return deletedDetalle;
    });

    return NextResponse.json(result);
    
  } catch (error) {
    console.error("Error en DELETE:", error);
    return NextResponse.json(
      { message: "Error al eliminar el detalle del pedido" },
      { status: 500 }
    );
  }
}