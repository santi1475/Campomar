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

  const pedido = await prisma.pedidos.findFirst({
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

  try {
    const { EmpleadoID, Fecha, Total, Estado, TipoPago } =
      await putSchema.validate(await request.json());

    const updatedPedido = await prisma.pedidos.update({
      where: {
        PedidoID: parseInt(id),
      },
      data: {
        EmpleadoID: EmpleadoID,
        Fecha: Fecha,
        Total: Total,
        Estado: Estado,
        TipoPago: TipoPago,
      },
    });

    return NextResponse.json(updatedPedido);
  } catch (error) {
    return NextResponse.json(error, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: Segments) {
  const { id } = params;

  const pedido = await prisma.pedidos.findFirst({
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

  const deletedPedido = await prisma.pedidos.delete({
    where: {
      PedidoID: parseInt(id),
    },
  });

  return NextResponse.json(deletedPedido);
}
