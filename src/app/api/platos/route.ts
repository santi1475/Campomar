import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import * as yup from "yup";

export async function GET(request: Request) {
  const platos = await prisma.platos.findMany();

  if (!platos) {
    return NextResponse.json(
      { message: "No se encontraron platos" },
      { status: 404 }
    );
  }

  return NextResponse.json(platos);
}

// PlatoID int AI PK
// Descripcion varchar(255)
// Precio decimal(10,2)
// CategoriaID int

const postSchema = yup.object({
  Descripcion: yup.string().required(),
  Precio: yup.number().required(),
  CategoriaID: yup.number().required(),
  PrecioLlevar: yup.number().optional().default(0).min(0),
});

export async function POST(request: Request) {
  try {
    const { Descripcion, Precio, CategoriaID, PrecioLlevar } = await postSchema.validate(
      await request.json()
    );

    const plato = await prisma.platos.create({
      data: {
        Descripcion,
        Precio,
        CategoriaID,
        PrecioLlevar: PrecioLlevar ?? 0,
      },
    });

    return NextResponse.json(plato);
  } catch (error) {
    return NextResponse.json(error, { status: 400 });
  }
}
