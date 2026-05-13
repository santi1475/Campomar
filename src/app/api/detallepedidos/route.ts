import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { CreateDetallePedidoSchema, parseJson } from "@/app/api/_lib/dto";
import { recalcularTotal } from "./util";

export async function GET() {
  const detallePedidos = await prisma.detallepedidos.findMany();
  return NextResponse.json(detallePedidos);
}

export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, CreateDetallePedidoSchema);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.message, details: parsed.details },
      { status: parsed.status }
    );
  }

  const { PedidoID, PlatoID, Cantidad, ParaLlevar, PrecioUnitario } = parsed.data;

  try {
    let precioFinal = PrecioUnitario;
    if (typeof precioFinal !== "number" || Number.isNaN(precioFinal)) {
      const plato = await prisma.platos.findUnique({ where: { PlatoID } });
      if (!plato) {
        return NextResponse.json({ message: "Plato no encontrado" }, { status: 404 });
      }
      const precioLlevar = plato.PrecioLlevar !== null ? Number(plato.PrecioLlevar) : 0;
      const precioBase = plato.Precio !== null ? Number(plato.Precio) : 0;
      precioFinal = ParaLlevar ? precioLlevar : precioBase;
    }

    const detallePedidos = await prisma.detallepedidos.create({
      data: {
        PedidoID,
        PlatoID,
        Cantidad,
        ParaLlevar,
        PrecioUnitario: precioFinal,
        Impreso: false,
      },
    });

    await recalcularTotal(PedidoID);

    return NextResponse.json(detallePedidos);
  } catch (error) {
    return NextResponse.json(
      { message: "Error al crear detalle", error: String(error) },
      { status: 400 }
    );
  }
}
