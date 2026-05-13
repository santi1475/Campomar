import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { normalizePeruRange } from "@/lib/dateRange";
import { PedidoEstado } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const peruRange = normalizePeruRange(startDate, endDate);

  try {
    const salesByEmployee = await prisma.pedidos.groupBy({
      by: ["EmpleadoID"],
      _sum: { Total: true },
      where: {
        Estado: 'Cerrado', // Pedidos completados
        Fecha: peruRange ? { gte: peruRange.start, lte: peruRange.end } : undefined,
      },
      orderBy: {
        _sum: { Total: "desc" },
      },
    });

    if (salesByEmployee.length === 0) {
      return NextResponse.json({ salesByEmployee: [] });
    }

    const employeeIDs = salesByEmployee.map((sale) => sale.EmpleadoID);

    const employees = await prisma.empleados.findMany({
      where: {
        EmpleadoID: { in: employeeIDs },
      },
      select: {
        EmpleadoID: true,
        Nombre: true,
      },
    });

    const employeeMap = new Map(
      employees.map((emp) => [emp.EmpleadoID, emp.Nombre || `Empleado #${emp.EmpleadoID}`])
    );

    const detailedSales = salesByEmployee.map((sale) => ({
      empleado: employeeMap.get(sale.EmpleadoID) || "Empleado Desconocido",
      totalSold: Number(sale._sum?.Total ?? 0),
    }));

  return NextResponse.json({ salesByEmployee: detailedSales, meta: peruRange ? { appliedPeruRange: { start: peruRange.start.toISOString(), end: peruRange.end.toISOString() } } : undefined });
  } catch (error) {
    console.error("Error al obtener ventas por empleado:", error);
    return NextResponse.json(
      { error: "No se pudieron obtener las ventas por empleado." },
      { status: 500 }
    );
  }
}