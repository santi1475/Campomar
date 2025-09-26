import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { normalizePeruRange } from "@/lib/dateRange";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const peruRange = normalizePeruRange(startDate, endDate);

  try {
    const topDishes = await prisma.detallepedidos.groupBy({
      by: ["PlatoID"],
      _sum: { Cantidad: true },
      where: {
        pedidos: {
          Fecha: peruRange ? { gte: peruRange.start, lte: peruRange.end } : undefined,
          Estado: false,
        },
      },
      orderBy: { _sum: { Cantidad: "desc" } },
      take: 5, // Opcional: cantidad de platos más vendidos
    });

    const detailedDishes = await Promise.all(
      topDishes.map(async (dish) => {
        const plato = await prisma.platos.findUnique({
          where: { PlatoID: dish.PlatoID },
        });
        return {
          dish: plato?.Descripcion || "Desconocido",
          totalSold: dish._sum.Cantidad || 0,
        };
      })
    );

  return NextResponse.json({ topDishes: detailedDishes, meta: peruRange ? { appliedPeruRange: { start: peruRange.start.toISOString(), end: peruRange.end.toISOString() } } : undefined });
  } catch (error) {
    console.error("Error fetching top dishes:", error);
    return NextResponse.json(
      { error: "Failed to fetch top dishes" },
      { status: 500 }
    );
  }
}
