import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const alertas = await prisma.auditoria_eliminaciones.findMany({
            orderBy: { Fecha: 'desc' },
            take: 50,
            include: {
                empleado: { select: { Nombre: true } },
                pedido: {
                    include: {
                        pedido_mesas: {
                            include: { mesas: true }
                        }
                    }
                }
            }
        });

        const formattedAlerts = alertas.map(alerta => {
            const mesas = alerta.pedido?.pedido_mesas?.map(pm => pm.mesas?.NumeroMesa).join(", ") || "Para Llevar";

            return {
                id: alerta.ID.toString(),
                dateTime: new Date(alerta.Fecha).toLocaleString('es-PE', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                }),
                table: mesas === "Para Llevar" ? "Para Llevar" : `Mesa ${mesas}`,
                waiter: alerta.empleado?.Nombre || "Desconocido",
                deletedItem: alerta.DescripcionPlato,
                quantity: alerta.CantidadEliminada,
                lostAmount: Number(alerta.TotalPerdido),
                orderId: `ORD-${alerta.PedidoID}`
            };
        });

        return NextResponse.json(formattedAlerts);
    } catch (error) {
        console.error("Error fetching alerts:", error);
        return NextResponse.json({ error: "Error fetching alerts" }, { status: 500 });
    }
}