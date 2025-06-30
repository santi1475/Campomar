import prisma from "@/lib/db";
import { mesas } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";
import * as yup from "yup";

interface Segments {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: Segments) {
  const { id } = params;

  const todo = await prisma.mesas.findUnique({
    where: {
      MesaID: parseInt(id),
    },
  });

  if (!todo) {
    return NextResponse.json(
      { message: "Mesa no encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json(todo);
}

const putSchema = yup.object({
  NumeroMesa: yup.number().optional(),
  Estado: yup.string().required().oneOf(["Libre", "Ocupada"]),
});

export async function PUT(request: Request, { params }: Segments) {
  const { id } = params;

  const mesa = await prisma.mesas.findFirst({
    where: {
      MesaID: parseInt(id),
    },
  });

  if (!mesa) {
    return NextResponse.json(
      { message: "Mesa no encontrada" },
      { status: 404 }
    );
  }

  try {
    const { NumeroMesa, Estado } = await putSchema.validate(
      await request.json()
    );
    const updatedMesa = await prisma.mesas.update({
      where: {
        MesaID: parseInt(id),
      },
      data: {
        NumeroMesa,
        Estado,
      },
    });

    return NextResponse.json(updatedMesa);
  } catch (error) {
    return NextResponse.json(error, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: Segments) {
  const { id } = params;

  const mesa = await prisma.mesas.findFirst({
    where: {
      MesaID: parseInt(id),
    },
  });

  if (!mesa) {
    return NextResponse.json(
      { message: "Mesa no encontrada" },
      { status: 404 }
    );
  }

  const deletedMesa = await prisma.mesas.delete({
    where: {
      MesaID: parseInt(id),
    },
  });

  return NextResponse.json(deletedMesa);
}
