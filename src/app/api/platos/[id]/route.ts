import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { UpdatePlatoSchema, parseJson } from "@/app/api/_lib/dto";

interface Segments {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: Segments) {
  const platoId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(platoId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  const plato = await prisma.platos.findFirst({ where: { PlatoID: platoId } });

  if (!plato) {
    return NextResponse.json(
      { message: `Dish with id ${params.id} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json(plato);
}

export async function PUT(request: NextRequest, { params }: Segments) {
  const platoId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(platoId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  const plato = await prisma.platos.findFirst({ where: { PlatoID: platoId } });
  if (!plato) {
    return NextResponse.json(
      { message: `Dish with id ${params.id} not found` },
      { status: 404 }
    );
  }

  const parsed = await parseJson(request, UpdatePlatoSchema);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.message, details: parsed.details },
      { status: parsed.status }
    );
  }
  const { Descripcion, Precio, CategoriaID, PrecioLlevar } = parsed.data;

  try {
    const updatedPlato = await prisma.platos.update({
      where: { PlatoID: platoId },
      data: { Descripcion, Precio, CategoriaID, PrecioLlevar: PrecioLlevar ?? 0 },
    });
    return NextResponse.json(updatedPlato);
  } catch (error) {
    return NextResponse.json(
      { message: "Error al actualizar plato", error: String(error) },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Segments) {
  const platoId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(platoId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  const plato = await prisma.platos.findFirst({ where: { PlatoID: platoId } });
  if (!plato) {
    return NextResponse.json(
      { message: `Dish with id ${params.id} not found` },
      { status: 404 }
    );
  }

  const deletedPlato = await prisma.platos.delete({
    where: { PlatoID: platoId },
  });

  return NextResponse.json(deletedPlato);
}
