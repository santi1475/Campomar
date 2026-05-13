import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { PedidoEstado, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getLimaDayRange(fechaISO?: string) {
  let year: number, month: number, day: number;
  if (fechaISO) {
    const m = fechaISO.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) throw new Error("Formato de fecha inválido. Use YYYY-MM-DD");
    year = parseInt(m[1]);
    month = parseInt(m[2]);
    day = parseInt(m[3]);
  } else {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .format(now)
      .split("-");
    year = parseInt(parts[0]);
    month = parseInt(parts[1]);
    day = parseInt(parts[2]);
  }

  const start = new Date(Date.UTC(year, month - 1, day, 5, 0, 0, 0));
  const end = new Date(start.getTime());
  end.setUTCDate(end.getUTCDate() + 1);
  end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);

  return { start, end, year, month, day };
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const fechaStr = searchParams.get("fecha");
    const empleadoId = searchParams.get("empleadoId");
    const metodoPago = searchParams.get("metodoPago");
    const paraLlevar = searchParams.get("paraLlevar");

    const { start, end, year, month, day } = getLimaDayRange(
      fechaStr || undefined
    );

    const where: any = {
      Estado: 'Cerrado', // Pagados
      Fecha: {
        gte: start,
        lte: end,
      },
    };

    if (empleadoId) {
      const parsedEmpleado = Number.parseInt(empleadoId, 10);
      if (Number.isFinite(parsedEmpleado)) where.EmpleadoID = parsedEmpleado;
    }
    if (metodoPago) {
      const parsedTipo = Number.parseInt(metodoPago, 10);
      if (Number.isFinite(parsedTipo)) where.TipoPago = parsedTipo;
    }
    if (paraLlevar === "true") where.ParaLlevar = true;
    else if (paraLlevar === "false") where.ParaLlevar = false;

    const pedidos = await prisma.pedidos.findMany({
      where,
      orderBy: { Fecha: "desc" },
      include: {
        detallepedidos: { include: { platos: true } },
        empleados: true,
        tipopago: true,
      },
    });

    const result = pedidos.map((p) => {
      const platosDet = p.detallepedidos.map((d) => {
        const precioUnitario = Number(d.PrecioUnitario ?? 0);
        return {
          DetalleID: d.DetalleID,
          PlatoID: d.PlatoID,
          Descripcion: d.platos?.Descripcion ?? null,
          Cantidad: d.Cantidad,
          UnitPrecio: precioUnitario,
          Subtotal: d.Cantidad * precioUnitario,
          EsPrecioLlevar:
            p.ParaLlevar &&
            precioUnitario === Number(d.platos?.PrecioLlevar ?? 0),
        };
      });
      const totalCalculado = platosDet.reduce((acc, pl) => acc + pl.Subtotal, 0);
      return {
        PedidoID: p.PedidoID,
        Fecha: p.Fecha,
        Empleado: p.empleados?.Nombre ?? null,
        EmpleadoID: p.EmpleadoID,
        MetodoPagoID: p.TipoPago,
        MetodoPago: p.tipopago?.Descripcion ?? null,
        ParaLlevar: p.ParaLlevar,
        Total: totalCalculado,
        Platos: platosDet,
      };
    });

    const fechaLocal = `${year.toString().padStart(4, "0")}-${month
      .toString()
      .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

    return NextResponse.json(
      {
        fecha: fechaLocal,
        timezone: "America/Lima",
        rangoUTC: { inicio: start.toISOString(), fin: end.toISOString() },
        count: result.length,
        pedidos: result,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[API historial-pagos] error", error);
    return NextResponse.json(
      { message: "Error al obtener historial de pagos", error: String(error) },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
