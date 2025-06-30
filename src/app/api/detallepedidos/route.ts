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
});

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const { PedidoID, PlatoID, Cantidad } = await postSchema.validate(
      await req.json()
    );

    const detallePedidos = await prisma.detallepedidos.create({
      data: {
        PedidoID,
        PlatoID,
        Cantidad,
      },
    });

    await recalcularTotal(PedidoID);

    return NextResponse.json(detallePedidos);
  } catch (error) {
    return NextResponse.json(error, { status: 400 });
  }
}
