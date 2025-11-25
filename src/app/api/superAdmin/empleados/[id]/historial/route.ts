// src/app/api/superAdmin/empleados/[id]/historial/route.ts
import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    console.log("=== [HISTORIAL API] Iniciando petición ===");
    console.log("[HISTORIAL API] Params recibidos:", params);
    console.log("[HISTORIAL API] URL:", request.url);
    
    try {
        const empleadoId = parseInt(params.id);
        console.log("[HISTORIAL API] EmpleadoID parseado:", empleadoId);

        if (isNaN(empleadoId)) {
            console.log("[HISTORIAL API] ERROR: ID inválido");
            return NextResponse.json({ error: "ID inválido" }, { status: 400 });
        }

        console.log("[HISTORIAL API] Consultando base de datos...");
        const historial = await prisma.auditoria_eliminaciones.findMany({
            where: { 
                EmpleadoID: empleadoId 
            },
            orderBy: { 
                Fecha: 'desc' 
            },
            include: {
                mesa: true
            }
        });

        console.log("[HISTORIAL API] Registros encontrados:", historial.length);
        console.log("[HISTORIAL API] Datos crudos:", JSON.stringify(historial, null, 2));

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

        console.log("[HISTORIAL API] Datos formateados:", JSON.stringify(formattedHistory, null, 2));
        console.log("=== [HISTORIAL API] Petición completada exitosamente ===");
        
        return NextResponse.json(formattedHistory);

    } catch (error) {
        console.error("=== [HISTORIAL API] ERROR ===");
        console.error("[HISTORIAL API] Tipo de error:", error instanceof Error ? error.name : typeof error);
        console.error("[HISTORIAL API] Mensaje:", error instanceof Error ? error.message : error);
        console.error("[HISTORIAL API] Stack:", error instanceof Error ? error.stack : "No stack disponible");
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
