import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import * as yup from "yup";

const getSchema = yup.object({
  Estado: yup.boolean().optional(),
});

export async function GET(req: NextRequest, res: NextResponse) {
  const { Estado } = await getSchema.validate(req.json());

  const pedidos = await prisma.pedidos.findMany({
    where: {
      Estado: Estado,
    },
  });
  if (!pedidos) {
    return NextResponse.json(
      { message: "No se encontraron pedidos" },
      { status: 404 }
    );
  }
  return NextResponse.json(pedidos);
}

const postSchema = yup.object({
  EmpleadoID: yup.number().required(),
  Fecha: yup.date().required(),
  Total: yup.number().optional(),
});

export async function POST(req: NextRequest, res: NextResponse) {
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
