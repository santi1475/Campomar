import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { normalizePeruRange } from "@/lib/dateRange";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const peruRange = normalizePeruRange(startDate, endDate);

  try {
    // Consulta las ganancias totales
    const totalEarnings = await prisma.pedidos.aggregate({
      _sum: { Total: true },
      where: {
        Fecha: peruRange ? { gte: peruRange.start, lte: peruRange.end } : undefined,
        Estado: false,
      },
    });

    // Consulta las ganancias por tipo de pago
    const earningsByPaymentType = await prisma.pedidos.groupBy({
      by: ["TipoPago"],
      _sum: { Total: true },
      where: {
        Fecha: peruRange ? { gte: peruRange.start, lte: peruRange.end } : undefined,
        Estado: false,
        TipoPago: { not: null }, // Asegurarse de excluir valores NULL
      },
    });

    // Mapear los valores de TipoPago a las claves correctas
    const earningsData = earningsByPaymentType.reduce(
      (acc: { efectivo: number; yape: number; pos: number }, item) => {
        switch (item.TipoPago) {
          case 1:
            acc.efectivo = Number(item._sum.Total) || 0;
            break;
          case 2:
            acc.yape = Number(item._sum.Total) || 0;
            break;
          case 3:
            acc.pos = Number(item._sum.Total) || 0;
            break;
        }
        return acc;
      },
      { efectivo: 0, yape: 0, pos: 0 }
    );

    return NextResponse.json({
      earnings: totalEarnings._sum.Total || 0,
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
