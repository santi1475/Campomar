import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { PedidoEstado } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const perdidas = await prisma.auditoria_eliminaciones.aggregate({
      _sum: { TotalPerdido: true },
      _count: { ID: true },
      where: { Fecha: { gte: primerDiaMes } },
    });

    const ventas = await prisma.pedidos.aggregate({
      _sum: { Total: true },
      _count: { PedidoID: true },
      where: {
        Fecha: { gte: primerDiaMes },
        Estado: PedidoEstado.Cerrado,
      },
    });

    const topDeletedRaw = await prisma.auditoria_eliminaciones.groupBy({
      by: ["DescripcionPlato"],
      _count: { DescripcionPlato: true },
      orderBy: { _count: { DescripcionPlato: "desc" } },
      take: 5,
    });

    const topSalesRaw = await prisma.detallepedidos.groupBy({
      by: ["PlatoID"],
      _sum: { Cantidad: true },
      orderBy: { _sum: { Cantidad: "desc" } },
      take: 5,
    });

    const platoIds = topSalesRaw
      .map((p) => p.PlatoID)
      .filter((id): id is number => id !== null);

    const platosInfo = await prisma.platos.findMany({
      where: { PlatoID: { in: platoIds } },
      select: { PlatoID: true, Descripcion: true },
    });

    const topSalesData = topSalesRaw.map((item) => ({
      name:
        platosInfo.find((p) => p.PlatoID === item.PlatoID)?.Descripcion ||
        "Desconocido",
      sales: item._sum.Cantidad ?? 0,
    }));

    const topDeletedData = topDeletedRaw.map((item) => ({
      name: item.DescripcionPlato,
      deletions: item._count.DescripcionPlato,
    }));

    const totalVentas = Number(ventas._sum.Total ?? 0);
    const conteoVentas = ventas._count.PedidoID ?? 0;

    return NextResponse.json({
      kpis: {
        dineroPerdido: Number(perdidas._sum.TotalPerdido ?? 0),
        intentosFraude: perdidas._count.ID ?? 0,
        ventasMes: totalVentas,
        ticketPromedio: conteoVentas > 0 ? totalVentas / conteoVentas : 0,
        platoEstrella: topSalesData[0]?.name || "N/A",
      },
      charts: {
        topSalesData,
        topDeletedData,
      },
    });
  } catch (error) {
    console.error("[API superAdmin/dashboard] error", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
