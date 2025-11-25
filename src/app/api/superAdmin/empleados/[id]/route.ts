// src/app/api/superAdmin/empleados/[id]/historial/route.ts
import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const empleadoId = parseInt(params.id);

        if (isNaN(empleadoId)) {
            return NextResponse.json({ error: "ID inválido" }, { status: 400 });
        }

        const historial = await prisma.auditoria_eliminaciones.findMany({
            where: { 
                EmpleadoID: empleadoId 
            },
            orderBy: { 
                Fecha: 'desc' 
            },
            include: {
                mesa: true // Para obtener el número de mesa si existe
            }
        });

        // Formateamos los datos para que coincidan con lo que espera el frontend
        const formattedHistory = historial.map(item => {
            const fechaObj = new Date(item.Fecha);
            
            // Determinar riesgo basado en el monto perdido
            const monto = Number(item.TotalPerdido);
            let risk: "high" | "medium" | "low" = "low";
            if (monto > 50) risk = "high";
            else if (monto > 20) risk = "medium";

            return {
                id: item.ID.toString(),
                date: fechaObj.toLocaleDateString("es-PE"),
                time: fechaObj.toLocaleTimeString("es-PE", { hour: '2-digit', minute: '2-digit' }),
                table: item.mesa ? `Mesa ${item.mesa.NumeroMesa}` : "Para Llevar",
                action: item.TipoAccion === "ELIMINACION_TOTAL" ? "deletion" : "correction",
                item: item.DescripcionPlato,
                amount: monto,
                risk: risk
            };
        });

        return NextResponse.json(formattedHistory);

    } catch (error) {
        console.error("Error obteniendo historial:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}