import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  try {
    // 1. Obtenemos las ventas agrupadas por ID de empleado, asegurándonos de que el ID no sea nulo.
    const salesByEmployee = await prisma.pedidos.groupBy({
      by: ["EmpleadoID"],
      _sum: { Total: true },
      where: {
        Estado: { equals: false }, // Pedidos completados
        EmpleadoID: { not: null }, // ¡Importante! Filtramos los pedidos sin empleado
        Fecha: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      orderBy: {
        _sum: { Total: "desc" },
      },
    });

    // Si no hay ventas que cumplan la condición, devolvemos un array vacío para evitar errores.
    if (salesByEmployee.length === 0) {
      return NextResponse.json({ salesByEmployee: [] });
    }

    // 2. Extraemos los IDs de los empleados. Gracias al filtro anterior, ahora estamos seguros de que son números.
    const employeeIDs = salesByEmployee.map((sale) => sale.EmpleadoID as number);

    // 3. Buscamos los nombres de esos empleados en una sola consulta para mayor eficiencia.
    const employees = await prisma.empleados.findMany({
      where: {
        EmpleadoID: { in: employeeIDs },
      },
      select: {
        EmpleadoID: true,
        Nombre: true,
      },
    });

    // 4. Creamos un mapa (Map) para buscar nombres de forma óptima. Es más rápido que un `reduce`.
    const employeeMap = new Map(
      employees.map((emp) => [emp.EmpleadoID, emp.Nombre || `Empleado #${emp.EmpleadoID}`])
    );

    // 5. Unimos los datos de ventas con los nombres de los empleados.
    const detailedSales = salesByEmployee.map((sale) => ({
      empleado: employeeMap.get(sale.EmpleadoID as number) || "Empleado Desconocido",
      totalSold: Number(sale._sum.Total) || 0,
    }));

    return NextResponse.json({ salesByEmployee: detailedSales });
  } catch (error) {
    console.error("Error al obtener ventas por empleado:", error);
    return NextResponse.json(
      { error: "No se pudieron obtener las ventas por empleado." },
      { status: 500 }
    );
  }
}