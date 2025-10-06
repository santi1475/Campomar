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
    let body: any;
    try {
      body = await request.json();
    } catch (err) {
      console.warn('POST /api/platos: request.json() falló o body vacío/no JSON válido', err);
      return NextResponse.json({ message: 'Se requiere un cuerpo JSON válido' }, { status: 400 });
    }

    const { Descripcion, Precio, CategoriaID, PrecioLlevar } = await postSchema.validate(body);

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
