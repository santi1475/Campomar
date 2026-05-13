import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { normalizePeruRange } from "@/lib/dateRange";
import { PedidoEstado } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const peruRange = normalizePeruRange(startDate, endDate);

  try {
    const pedidosPagados = await prisma.pedidos.findMany({
      where: {
        Fecha: peruRange ? { gte: peruRange.start, lte: peruRange.end } : undefined,
        Estado: PedidoEstado.Cerrado,
      },
      include: {
        detallepedidos: true,
      },
    });

    const totalEarnings = pedidosPagados.reduce((acc, pedido) => {
      const pedidoTotal = pedido.detallepedidos.reduce((subAcc, detalle) => {
        return subAcc + Number(detalle.PrecioUnitario) * detalle.Cantidad;
      }, 0);
      return acc + pedidoTotal;
    }, 0);

    const earningsByPaymentType = await prisma.pedidos.groupBy({
      by: ["TipoPago"],
      _sum: { Total: true },
      where: {
        Fecha: peruRange ? { gte: peruRange.start, lte: peruRange.end } : undefined,
        Estado: PedidoEstado.Cerrado,
        TipoPago: { not: null },
      },
    });

    const earningsData = earningsByPaymentType.reduce(
      (acc: { efectivo: number; yape: number; pos: number }, item) => {
        const total = Number(item._sum?.Total ?? 0);
        switch (item.TipoPago) {
          case 1:
            acc.efectivo = total;
            break;
          case 2:
            acc.yape = total;
            break;
          case 3:
            acc.pos = total;
            break;
        }
        return acc;
      },
      { efectivo: 0, yape: 0, pos: 0 }
    );

    return NextResponse.json({
      earnings: totalEarnings || 0,
      earningsByPaymentType: earningsData,
      meta: peruRange ? { appliedPeruRange: { start: peruRange.start.toISOString(), end: peruRange.end.toISOString() } } : undefined,
    });
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}
