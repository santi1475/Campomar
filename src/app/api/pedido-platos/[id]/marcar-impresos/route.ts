import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { MarcarImpresosSchema, parseJson } from "@/app/api/_lib/dto";

interface Segments {
  params: { id: string };
}

export async function PUT(request: NextRequest, { params }: Segments) {
  const pedidoId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(pedidoId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  const parsed = await parseJson(request, MarcarImpresosSchema);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.message, details: parsed.details },
      { status: parsed.status }
    );
  }

  const { detalleIds } = parsed.data;

  try {
    const updateResult = await prisma.detallepedidos.updateMany({
      where: {
        PedidoID: pedidoId,
        DetalleID: { in: detalleIds },
      },
      data: { Impreso: true },
    });

    return NextResponse.json({
      message: "Detalles marcados como impresos",
      updateResult,
    });
  } catch (error) {
    console.error("[API marcar-impresos] error", error);
    return NextResponse.json(
      { message: "Error al marcar platos como impresos" },
      { status: 500 }
    );
  }
}
