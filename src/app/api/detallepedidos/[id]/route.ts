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
    const { PlatoID, Cantidad, operacion } = await putSchema.validate(
      await request.json()
    );

    let nuevaCantidad = detallePedido.Cantidad;

    if (Cantidad !== undefined) {
      nuevaCantidad = Cantidad;
    } else if (operacion === "incrementar") {
      nuevaCantidad += 1;
    } else if (operacion === "decrementar") {
      nuevaCantidad = Math.max(nuevaCantidad - 1, 1);
    }

    const updatedDetallePedido = await prisma.detallepedidos.update({
      where: {
        DetalleID: parseInt(id),
      },
      data: {
        PlatoID,
        Cantidad: nuevaCantidad,
      },
    });

    await recalcularTotal(detallePedido.PedidoID);

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
