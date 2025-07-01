import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import * as yup from "yup";

// --- GET ---
// La función GET se ha modificado para leer desde la URL.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const estadoParam = searchParams.get("Estado");

  // Creamos un objeto 'where' para el filtro de Prisma.
  const where: { Estado?: boolean } = {};

  // Si el parámetro 'Estado' existe en la URL, lo agregamos a nuestro filtro.
  if (estadoParam !== null) {
    where.Estado = estadoParam === "true";
  }

  try {
    const pedidos = await prisma.pedidos.findMany({
      where: where,
    });

    // La lógica de respuesta permanece igual.
    if (!pedidos) {
      return NextResponse.json(
        { message: "No se encontraron pedidos" },
        { status: 404 }
      );
    }
    return NextResponse.json(pedidos);
  } catch (error) {
    // Capturamos cualquier otro posible error.
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// --- POST ---
// La función POST ya era correcta y no necesita cambios.
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
      },
    });

    return NextResponse.json(pedido);
  } catch (error) {
    return NextResponse.json(error, { status: 400 });
  }
}