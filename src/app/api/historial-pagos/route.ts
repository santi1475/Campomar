import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/*
  GET /api/historial-pagos
  Query params opcionales:
    - fecha=YYYY-MM-DD  (por defecto, hoy en timezone UTC; si manejas otra zona, ajustar en frontend o aquí)
    - empleadoId=number (filtrar por mozo)
    - metodoPago=number (1=Efectivo,2=Yape,3=POS)

  Respuesta: lista de pedidos pagados ese día con sus platos y método de pago
*/
// Utilidad para obtener el rango [start,end] de un día en timezone America/Lima (UTC-5)
// Sin DST (Perú actualmente no aplica DST). Día local 00:00 -> 05:00 UTC mismo día; 23:59:59.999 -> 04:59:59.999 UTC día siguiente
function getLimaDayRange(fechaISO?: string) {
  let year: number, month: number, day: number;
  if (fechaISO) {
    // fechaISO formato YYYY-MM-DD
    const m = fechaISO.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) throw new Error("Formato de fecha inválido. Use YYYY-MM-DD");
    year = parseInt(m[1]);
    month = parseInt(m[2]); // 1-12
    day = parseInt(m[3]);
  } else {
    // Obtener fecha actual en Lima
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).format(now).split("-");
    year = parseInt(parts[0]);
    month = parseInt(parts[1]);
    day = parseInt(parts[2]);
  }

  // Inicio del día local (00:00 Lima) en UTC: sumar 5 horas
  const start = new Date(Date.UTC(year, month - 1, day, 5, 0, 0, 0));
  // Fin del día local (23:59:59.999 Lima) = inicio del siguiente día local menos 1 ms
  const end = new Date(start.getTime());
  end.setUTCDate(end.getUTCDate() + 1);
  end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);

  return { start, end, year, month, day };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fechaStr = searchParams.get("fecha"); // YYYY-MM-DD en hora local Lima
  const empleadoId = searchParams.get("empleadoId");
  const metodoPago = searchParams.get("metodoPago");
  const paraLlevar = searchParams.get("paraLlevar"); // "true" | "false"

    const { start, end, year, month, day } = getLimaDayRange(fechaStr || undefined);

    const where: any = {
      Estado: false, // Pagados (según tu lógica al poner Estado: false en el pago)
      Fecha: {
        gte: start,
        lte: end,
      },
    };

  if (empleadoId) where.EmpleadoID = parseInt(empleadoId);
  if (metodoPago) where.TipoPago = parseInt(metodoPago);
  if (paraLlevar === "true") where.ParaLlevar = true;
  else if (paraLlevar === "false") where.ParaLlevar = false;

    const pedidos = await prisma.pedidos.findMany({
      where,
      orderBy: { Fecha: "desc" },
      include: {
        detallepedidos: {
          include: {
            platos: true,
          },
        },
        empleados: true,
        tipopago: true,
      },
    });

    const result = pedidos.map((p) => ({
      PedidoID: p.PedidoID,
      Fecha: p.Fecha,
      Empleado: p.empleados?.Nombre ?? null,
      EmpleadoID: p.EmpleadoID,
      MetodoPagoID: p.TipoPago,
      MetodoPago: p.tipopago?.Descripcion ?? null,
      ParaLlevar: p.ParaLlevar,
      Total: p.Total,
      Platos: p.detallepedidos.map((d) => ({
        DetalleID: d.DetalleID,
        PlatoID: d.PlatoID,
        Descripcion: d.platos?.Descripcion ?? null,
        Cantidad: d.Cantidad,
        Subtotal: d.Cantidad * Number(d.platos?.Precio ?? 0),
      })),
    }));

    const fechaLocal = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;

    return NextResponse.json({
      fecha: fechaLocal, // Fecha local Lima solicitada
      timezone: "America/Lima",
      rangoUTC: { inicio: start.toISOString(), fin: end.toISOString() },
      count: result.length,
      pedidos: result,
    });
  } catch (error) {
    console.error("/api/historial-pagos GET error", error);
    return NextResponse.json({ message: "Error al obtener historial de pagos", error: String(error) }, { status: 500 });
  }
}
