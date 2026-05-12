import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { UpdateMesaSchema, parseJson } from "@/app/api/_lib/dto";

interface Segments {
  params: { id: string };
}

export async function GET(_request: Request, { params }: Segments) {
  const mesa = await prisma.mesas.findUnique({
    where: { MesaID: parseInt(params.id) },
  });

  if (!mesa) {
    return NextResponse.json({ message: "Mesa no encontrada" }, { status: 404 });
  }

  return NextResponse.json(mesa);
}

export async function PUT(request: Request, { params }: Segments) {
  const id = parseInt(params.id);
  const mesa = await prisma.mesas.findFirst({ where: { MesaID: id } });

  if (!mesa) {
    return NextResponse.json({ message: "Mesa no encontrada" }, { status: 404 });
  }

  const parsed = await parseJson(request, UpdateMesaSchema);
  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message, details: parsed.details }, { status: parsed.status });
  }

  try {
    const updatedMesa = await prisma.mesas.update({
      where: { MesaID: id },
      data: parsed.data,
    });
    return NextResponse.json(updatedMesa);
  } catch (error) {
    return NextResponse.json({ message: "Error al actualizar mesa", error: String(error) }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Segments) {
  const id = parseInt(params.id);
  const mesa = await prisma.mesas.findFirst({ where: { MesaID: id } });

  if (!mesa) {
    return NextResponse.json({ message: "Mesa no encontrada" }, { status: 404 });
  }

  const deletedMesa = await prisma.mesas.delete({
    where: { MesaID: id },
  });

  return NextResponse.json(deletedMesa);
}
