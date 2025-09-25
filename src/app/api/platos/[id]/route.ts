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

  const plato = await prisma.platos.findFirst({
    where: { PlatoID: parseInt(id) },
  });

  if (!plato) {
    return NextResponse.json(
      { message: `Dish with id ${id} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json(plato);
}

const putSchema = yup.object({
  Descripcion: yup.string().required(),
  Precio: yup.number().required(),
  CategoriaID: yup.number().required(),
  PrecioLlevar: yup.number().optional().default(0).min(0),
});

export async function PUT(request: Request, { params }: Segments) {
  const { id } = params;

  const plato = await prisma.platos.findFirst({
    where: { PlatoID: parseInt(id) },
  });

  if (!plato) {
    return NextResponse.json(
      { message: `Dish with id ${id} not found` },
      { status: 404 }
    );
  }

  try {
    const { Descripcion, Precio, CategoriaID, PrecioLlevar } = await putSchema.validate(
      await request.json()
    );

    const updatedPlato = await prisma.platos.update({
      where: { PlatoID: parseInt(id) },
      data: { Descripcion, Precio, CategoriaID, PrecioLlevar: PrecioLlevar ?? 0 },
    });

    return NextResponse.json(updatedPlato);
  } catch (error) {
    return NextResponse.json(error, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: Segments) {
  const { id } = params;

  const plato = await prisma.platos.findFirst({
    where: { PlatoID: parseInt(id) },
  });

  if (!plato) {
    return NextResponse.json(
      { message: `Dish with id ${id} not found` },
      { status: 404 }
    );
  }

  const deletedPlato = await prisma.platos.delete({
    where: { PlatoID: parseInt(id) },
  });

  return NextResponse.json(deletedPlato);
}
