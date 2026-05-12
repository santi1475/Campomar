import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { PedidoEstado, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const tipo = searchParams.get("tipo");
    const sort = searchParams.get("sort");
    const mesaNum = searchParams.get("mesa");
    const empleadoId = searchParams.get("empleado");

    const where: Prisma.pedidosWhereInput = {
      Estado: PedidoEstado.Activo,
    };

    if (tipo === "mesas") {
      where.ParaLlevar = false;
    } else if (tipo === "llevar") {
      where.ParaLlevar = true;
    }

    if (empleadoId && empleadoId !== "todos") {
      const parsedEmpleado = Number.parseInt(empleadoId, 10);
      if (Number.isFinite(parsedEmpleado)) {
        where.EmpleadoID = parsedEmpleado;
      }
    }

    if (mesaNum) {
      const parsedMesa = Number.parseInt(mesaNum, 10);
      if (Number.isFinite(parsedMesa)) {
        where.pedido_mesas = {
          some: { mesas: { NumeroMesa: parsedMesa } },
        };
      }
    }

    const orderBy: Prisma.pedidosOrderByWithRelationInput = {
      Fecha: sort === "desc" ? "desc" : "asc",
    };

    const pedidos = await prisma.pedidos.findMany({
      where,
      orderBy,
      include: {
        empleados: { select: { Nombre: true } },
        pedido_mesas: { include: { mesas: true } },
        detallepedidos: {
          include: { platos: { select: { Descripcion: true } } },
          take: 5,
        },
      },
    });

    return NextResponse.json(pedidos, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[API admin/cola-pedidos] error", error);
    if (error instanceof Error && error.message.includes("Invalid argument")) {
      return NextResponse.json(
        { error: "Filtro inválido. Verifique los números." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al obtener la cola de pedidos" },
      { status: 500 }
    );
  }
}
