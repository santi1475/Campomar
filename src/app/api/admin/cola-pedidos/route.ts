import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server"; // Importar NextRequest

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) { // Usar NextRequest
    try {
        // 1. Leer los parámetros de la URL
        const searchParams = req.nextUrl.searchParams;
        const tipo = searchParams.get("tipo");
        const sort = searchParams.get("sort");
        const mesaNum = searchParams.get("mesa");
        const empleadoId = searchParams.get("empleado");

        // 2. Construir el 'where' dinámicamente
        let where: any = {
            Estado: true, // Siempre traer solo pedidos activos
        };

        // Filtro por Tipo (Mesas / Para Llevar)
        if (tipo === 'mesas') {
            where.ParaLlevar = false;
        } else if (tipo === 'llevar') {
            where.ParaLlevar = true;
        }

        // Filtro por Empleado (si se proporciona y no es "todos")
        if (empleadoId && empleadoId !== "todos") {
            where.EmpleadoID = parseInt(empleadoId);
        }

        // Filtro por Número de Mesa (si se proporciona)
        // Esto es un filtro relacional
        if (mesaNum) {
            where.pedido_mesas = {
                some: {
                    mesas: {
                        NumeroMesa: parseInt(mesaNum)
                    }
                }
            };
        }

        const orderBy: { Fecha?: 'asc' | 'desc' } = {
            Fecha: sort === 'desc' ? 'desc' : 'asc'
        };

        // 4. Ejecutar la consulta
        const pedidos = await prisma.pedidos.findMany({
            where: where,
            orderBy: orderBy,
            include: {
                empleados: {
                    select: { Nombre: true },
                },
                pedido_mesas: {
                    include: {
                        mesas: true, // Traemos la mesa completa
                    },
                },
                detallepedidos: {
                    include: {
                        platos: {
                            select: { Descripcion: true }
                        }
                    },
                    // optimización: no traer más de 5 detalles por tarjeta
                    take: 5
                }
            },
        });

        return NextResponse.json(pedidos, {
            headers: { 'Cache-Control': 'no-store' }
        });

    } catch (error) {
        console.error("Error API cola-pedidos:", error);
        // Devolver un error claro si el filtro de número falla (ej. si ponen texto)
        if (error instanceof Error && error.message.includes("Invalid argument")) {
            return NextResponse.json(
                { error: "Filtro inválido. Verifique los números." },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Error al obtener la cola de pedidos" },
            { status: 500 }
        );
    }
}