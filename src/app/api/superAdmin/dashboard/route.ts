import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

        const perdidas = await prisma.auditoria_eliminaciones.aggregate({
            _sum: { TotalPerdido: true },
            _count: { ID: true },
            where: {
                Fecha: { gte: primerDiaMes }
            }
        });

        const ventas = await prisma.pedidos.aggregate({
            _sum: { Total: true },
            _count: { PedidoID: true },
            where: {
                Fecha: { gte: primerDiaMes },
                Estado: false 
            }
        });

        const topDeletedRaw = await prisma.auditoria_eliminaciones.groupBy({
            by: ['DescripcionPlato'],
            _count: { DescripcionPlato: true },
            orderBy: { _count: { DescripcionPlato: 'desc' } },
            take: 5,
        });

        const topSalesRaw = await prisma.detallepedidos.groupBy({
            by: ['PlatoID'],
            _sum: { Cantidad: true },
            orderBy: { _sum: { Cantidad: 'desc' } },
            take: 5,
        });

        const platosInfo = await prisma.platos.findMany({
            where: { PlatoID: { in: topSalesRaw.map(p => p.PlatoID) } },
            select: { PlatoID: true, Descripcion: true }
        });

        const topSalesData = topSalesRaw.map(item => ({
            name: platosInfo.find(p => p.PlatoID === item.PlatoID)?.Descripcion || "Desconocido",
            sales: item._sum.Cantidad || 0
        }));

        const topDeletedData = topDeletedRaw.map(item => ({
            name: item.DescripcionPlato,
            deletions: item._count.DescripcionPlato
        }));

        return NextResponse.json({
            kpis: {
                dineroPerdido: Number(perdidas._sum.TotalPerdido || 0),
                intentosFraude: perdidas._count.ID,
                ventasMes: Number(ventas._sum.Total || 0),
                ticketPromedio: ventas._count.PedidoID > 0
                    ? Number(ventas._sum.Total || 0) / ventas._count.PedidoID
                    : 0,
                platoEstrella: topSalesData[0]?.name || "N/A"
            },
            charts: {
                topSalesData,
                topDeletedData,
            }
        });

    } catch (error) {
        console.error("Error en dashboard API:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}