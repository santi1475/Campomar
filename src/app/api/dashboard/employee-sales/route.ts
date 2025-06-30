import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  try {
    // Consulta para obtener ventas totales agrupadas por empleado con su nombre
    const salesByEmployee = await prisma.pedidos.groupBy({
      by: ["EmpleadoID"],
      _sum: { Total: true },
      where: {
        Fecha: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
        Estado: false, // Solo pedidos completados
      },
      orderBy: {
        _sum: { Total: "desc" },
      },
    });

    // Obtenemos los nombres de empleados en una sola consulta
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

    // Creamos un mapa para relacionar EmpleadoID con su nombre
    const employeeMap = employees.reduce((acc, emp) => {
      acc[emp.EmpleadoID] = emp.Nombre || `EmpleadoID ${emp.EmpleadoID}`;
      return acc;
    }, {} as { [key: number]: string });

    // Fusionamos las ventas totales con los nombres de empleados
    const detailedSales = salesByEmployee.map((sale) => ({
      empleado: employeeMap[sale.EmpleadoID],
      totalSold: Number(sale._sum.Total) || 0,
    }));

    return NextResponse.json({ salesByEmployee: detailedSales });
  } catch (error) {
    console.error("Error fetching sales by employee:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales by employee" },
      { status: 500 }
    );
  }
}
