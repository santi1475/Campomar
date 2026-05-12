import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { CreateMesaSchema, parseJson } from "@/app/api/_lib/dto";

export async function GET() {
  const mesas = await prisma.mesas.findMany({
    orderBy: { NumeroMesa: "asc" },
  });

  if (!mesas) {
    return NextResponse.json({ message: "No se encontraron mesas" }, { status: 404 });
  }

  return NextResponse.json(mesas);
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, CreateMesaSchema);
  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message, details: parsed.details }, { status: parsed.status });
  }
  try {
    const mesa = await prisma.mesas.create({
      data: parsed.data,
    });
    return NextResponse.json(mesa, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error al crear mesa", error: String(error) }, { status: 500 });
  }
}
