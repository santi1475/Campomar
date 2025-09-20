import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const categorias = await prisma.categorias.findMany({
      select: {
        CategoriaID: true,
        Descripcion: true,
      },
      orderBy: { CategoriaID: "asc" },
    });
    return NextResponse.json(categorias);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener las categorías" }, { status: 500 });
  }
}
