import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const pedidos = await prisma.pedidos.findMany({
      where: {
        Estado: true,
        ParaLlevar: true,
      },
      include: {
        detallepedidos: {
          include: {
            platos: true,
          },
        },
        empleados: true,
      },
      orderBy: {
        Fecha: "asc",
      },
    });
    return NextResponse.json({ count: pedidos.length, pedidos });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener pedidos activos para llevar" }, { status: 500 });
  }
}
