import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";

// Forzamos comportamiento dinámico y sin caché ISR
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const inicio = Date.now();
  const marca = new Date().toISOString();
  try {
    console.log(`[API pedidos-activos-para-llevar] ⏱️ Inicio ${marca}`);

    const { searchParams } = new URL(request.url);
    const debug = searchParams.get('debug') === '1';

    const pedidos = await prisma.pedidos.findMany({
      where: {
        Estado: true,
        ParaLlevar: true,
      },
      include: {
        detallepedidos: {
          include: {
            platos: true,
          },
        },
        empleados: true,
      },
      orderBy: {
        Fecha: "asc",
      },
    });

    // Mapear para incluir PrecioUnitario en cada detalle
    const pedidosConPrecioUnitario = pedidos.map(p => ({
      ...p,
      detallepedidos: p.detallepedidos.map(d => ({
        ...d,
        PrecioUnitario: d.PrecioUnitario
      }))
    }));

    console.log(`[API pedidos-activos-para-llevar] ✅ Encontrados: ${pedidos.length}`);
    if (pedidos.length === 0) {
      // Intento de diagnóstico extra: contar totales para llevar sin filtrar estado
      const totalParaLlevar = await prisma.pedidos.count({ where: { ParaLlevar: true } });
      const totalParaLlevarActivos = await prisma.pedidos.count({ where: { ParaLlevar: true, Estado: true } });
      console.log(`[API pedidos-activos-para-llevar] ℹ️ Estadísticas -> ParaLlevar(total): ${totalParaLlevar}, ParaLlevar Activos (Estado=true): ${totalParaLlevarActivos}`);
    }

    const duracion = Date.now() - inicio;
    console.log(`[API pedidos-activos-para-llevar] ⏳ Duración ${duracion}ms`);
    let extra: any = {};
    if (debug) {
      // Traer todos los ParaLlevar (independiente de estado) para diagnóstico
      const todosParaLlevar = await prisma.pedidos.findMany({
        where: { ParaLlevar: true },
        select: { PedidoID: true, Estado: true, Total: true, Fecha: true }
      });
      extra.diagnostic = {
        sample: todosParaLlevar.slice(-15), // últimos 15
        totalParaLlevar: todosParaLlevar.length,
        activos: todosParaLlevar.filter(p => p.Estado).length,
        inactivos: todosParaLlevar.filter(p => !p.Estado).length,
      };
    }

  return NextResponse.json({ count: pedidosConPrecioUnitario.length, pedidos: pedidosConPrecioUnitario, generatedAt: marca, ...extra }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error(`[API pedidos-activos-para-llevar] ❌ Error:`, error);
    return NextResponse.json({ error: "Error al obtener pedidos activos para llevar" }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
