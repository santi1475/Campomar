import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import * as yup from "yup";

export async function GET(request: Request) {
  const mesas = await prisma.mesas.findMany();

  if (!mesas) {
    return NextResponse.json(
      { message: "No se encontraron mesas" },
      { status: 404 }
    );
  }

  return NextResponse.json(mesas);
}

const postSchema = yup.object({
  NumeroMesa: yup.number().required(),
  Estado: yup.string().required().oneOf(["Libre", "Ocupada"]),
});

export async function POST(request: Request) {
  try {
    const { NumeroMesa, Estado } = await postSchema.validate(
      await request.json()
    );
    const mesa = await prisma.mesas.create({
      data: {
        NumeroMesa,
        Estado,
      },
    });

    return NextResponse.json(mesa);
  } catch (error) {
    return NextResponse.json(error, { status: 400 });
  }
}
