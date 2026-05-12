import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
import { PedidoEstado } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DiagnosticSample = {
  PedidoID: number;
  Estado: PedidoEstado;
  Total: unknown;
  Fecha: Date | null;
};

type DiagnosticInfo = {
  sample: DiagnosticSample[];
  totalParaLlevar: number;
  activos: number;
  inactivos: number;
};

type ExtraPayload = { diagnostic?: DiagnosticInfo };

export async function GET(request: NextRequest) {
  const inicio = Date.now();
  const marca = new Date().toISOString();
  try {
    const { searchParams } = new URL(request.url);
    const debug = searchParams.get("debug") === "1";

    const pedidos = await prisma.pedidos.findMany({
      where: {
        Estado: PedidoEstado.Activo,
        ParaLlevar: true,
      },
      include: {
        detallepedidos: { include: { platos: true } },
        empleados: true,
      },
      orderBy: { Fecha: "asc" },
    });

    const pedidosConPrecioUnitario = pedidos.map((p) => ({
      ...p,
      detallepedidos: p.detallepedidos.map((d) => ({
        ...d,
        PrecioUnitario: d.PrecioUnitario,
      })),
    }));

    const duracion = Date.now() - inicio;
    console.log(
      `[API pedidos-activos-para-llevar] count=${pedidos.length} duracion=${duracion}ms`
    );

    const extra: ExtraPayload = {};
    if (debug) {
      const todosParaLlevar = await prisma.pedidos.findMany({
        where: { ParaLlevar: true },
        select: { PedidoID: true, Estado: true, Total: true, Fecha: true },
      });
      extra.diagnostic = {
        sample: todosParaLlevar.slice(-15),
        totalParaLlevar: todosParaLlevar.length,
        activos: todosParaLlevar.filter((p) => p.Estado === PedidoEstado.Activo).length,
        inactivos: todosParaLlevar.filter((p) => p.Estado === PedidoEstado.Cerrado).length,
      };
    }

    return NextResponse.json(
      {
        count: pedidosConPrecioUnitario.length,
        pedidos: pedidosConPrecioUnitario,
        generatedAt: marca,
        ...extra,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[API pedidos-activos-para-llevar] error", error);
    return NextResponse.json(
      { error: "Error al obtener pedidos activos para llevar" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
