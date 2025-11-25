import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const empleados = await prisma.empleados.findMany({
            where: { Activo: true },
            select: { EmpleadoID: true, Nombre: true, DNI: true }
        });

        const scorecard = await Promise.all(empleados.map(async (emp) => {
            const ventas = await prisma.pedidos.aggregate({
                _sum: { Total: true },
                _count: { PedidoID: true },
                where: {
                    EmpleadoID: emp.EmpleadoID,
                    Estado: false 
                }
            });

            const sospechas = await prisma.auditoria_eliminaciones.count({
                where: {
                    EmpleadoID: emp.EmpleadoID,
                    EstabaImpreso: true
                }
            });

            let trustLevel = "high";
            if (sospechas > 4) trustLevel = "low";
            else if (sospechas > 1) trustLevel = "medium";

            return {
                id: emp.EmpleadoID.toString(),
                name: emp.Nombre,
                dni: emp.DNI,
                avatar: null,
                totalSales: Number(ventas._sum.Total || 0),
                tablesServed: ventas._count.PedidoID,
                suspiciousDeletions: sospechas,
                trustLevel: trustLevel
            };
        }));

        scorecard.sort((a, b) => b.suspiciousDeletions - a.suspiciousDeletions);

        return NextResponse.json(scorecard);
    } catch (error) {
        console.error("Error fetching employee scorecard:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}