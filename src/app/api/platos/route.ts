import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { CreatePlatoSchema, parseJson } from "@/app/api/_lib/dto";

export async function GET() {
  const platos = await prisma.platos.findMany({
    include: {
      categorias: { select: { Color: true } },
    },
  });

  return NextResponse.json(platos);
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, CreatePlatoSchema);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.message, details: parsed.details },
      { status: parsed.status }
    );
  }
  const { Descripcion, Precio, CategoriaID, PrecioLlevar } = parsed.data;

  try {
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
    return NextResponse.json(
      { message: "Error al crear plato", error: String(error) },
      { status: 400 }
    );
  }
}
