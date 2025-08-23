import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import * as yup from "yup";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const estadoParam = searchParams.get("Estado");

  const where: { Estado?: boolean } = {};

  if (estadoParam !== null) {
    where.Estado = estadoParam === "true";
  }

  try {
    const pedidos = await prisma.pedidos.findMany({
      where: where,
    });

    if (!pedidos) {
      return NextResponse.json(
        { message: "No se encontraron pedidos" },
        { status: 404 }
      );
    }
    return NextResponse.json(pedidos);
  } catch (error) {
    return NextResponse.json(
      { message: "Error al obtener los pedidos", error },
      { status: 500 }
    );
  }
}

const postSchema = yup.object({
  EmpleadoID: yup.number().required(),
  Fecha: yup.date().required(),
  Total: yup.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { EmpleadoID, Fecha, Total } = await postSchema.validate(
      await req.json()
    );
    const pedido = await prisma.pedidos.create({
      data: {
        EmpleadoID,
        Fecha,
        Total: Total ?? 0,
        Estado: true 
      },
    });

    return NextResponse.json(pedido);
  } catch (error) {
    return NextResponse.json(error, { status: 400 });
  }
}