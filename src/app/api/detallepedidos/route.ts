import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import * as yup from "yup";
import { recalcularTotal } from "./util";

export async function GET(req: NextRequest, res: NextResponse) {
  const detallePedidos = await prisma.detallepedidos.findMany();

  if (!detallePedidos) {
    return NextResponse.json(
      { message: "No se encontraron pedidos" },
      { status: 404 }
    );
  }

  return NextResponse.json(detallePedidos);
}

// DetalleID int AI PK
// PedidoID int
// PlatoID int
// Cantidad int

const postSchema = yup.object({
  PedidoID: yup.number().required(),
  PlatoID: yup.number().required(),
  Cantidad: yup.number().required(),
  ParaLlevar: yup.boolean().default(false),
  PrecioUnitario: yup.number().optional(),
});

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const { PedidoID, PlatoID, Cantidad, ParaLlevar, PrecioUnitario } = await postSchema.validate(
      await req.json()
    );

    // Buscar el plato para obtener el precio correcto si no se envía
    let precioFinal = PrecioUnitario;
    if (typeof precioFinal !== "number" || isNaN(precioFinal)) {
      const plato = await prisma.platos.findUnique({
        where: { PlatoID },
      });
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
        Impreso: false, // Asegurar que los nuevos platos no estén marcados como impresos
      },
    });

    await recalcularTotal(PedidoID);

    return NextResponse.json(detallePedidos);
  } catch (error) {
    return NextResponse.json(error, { status: 400 });
  }
}
