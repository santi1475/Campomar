import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import * as yup from "yup";
import { recalcularTotal } from "../util";

interface Segments {
  params: {
    id: string;
  };
}

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

const putSchema = yup.object({
  PlatoID: yup.number().optional(),
  Cantidad: yup.number().optional(),
  operacion: yup.string().oneOf(["incrementar", "decrementar"]).optional(),
  cantidad: yup.number().optional(), // Para especificar cuánto incrementar
});

export async function PUT(request: Request, { params }: Segments) {
  const { id } = params;

  const detallePedido = await prisma.detallepedidos.findFirst({
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

  try {
    let body: any;
    try {
      body = await request.json();
    } catch (err) {
      console.warn('PUT /api/detallepedidos/[id]: request.json() falló o body vacío/no JSON válido', err);
      return NextResponse.json({ message: 'Se requiere un cuerpo JSON válido' }, { status: 400 });
    }

    const { PlatoID, Cantidad, operacion, cantidad } = await putSchema.validate(body);

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

    const updatedDetallePedido = await prisma.$transaction(async (tx) => {
      const updated = await tx.detallepedidos.update({
        where: {
          DetalleID: parseInt(id),
        },
        data: {
          PlatoID,
          Cantidad: nuevaCantidad,
          // Marcar como no impreso cuando se modifica
          Impreso: false,
        },
      });

      // Recalcular el total dentro de la transacción
      // Traer si el pedido es ParaLlevar
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
        const alt = detalle.platos.PrecioLlevar ? Number(detalle.platos.PrecioLlevar) : 0;
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
    return NextResponse.json(error, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: Segments) {
  const { id } = params;

  const detallePedido = await prisma.detallepedidos.findFirst({
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

  const deletedDetalle = await prisma.detallepedidos.delete({
    where: {
      DetalleID: parseInt(id),
    },
  });

  await recalcularTotal(detallePedido.PedidoID);

  return NextResponse.json(deletedDetalle);
}
