import prisma from "@/lib/db";
import { detallepedidos, pedidos } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";
import * as yup from "yup";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mesasParam = searchParams.get("mesas");

  if (!mesasParam) {
    return NextResponse.json(
      { message: "No se proporcionaron mesas" },
      { status: 404 }
    );
  }

  const mesasArray = mesasParam.split(",").map(Number);

  try {
    // Buscar el pedido asociado a alguna de las mesas
    const pedidosMesas = await prisma.pedido_mesas.findMany({
      where: {
        MesaID: {
          in: mesasArray,
        },
      },
      include: {
        pedidos: {
          where: {
            Estado: true,
          },
          include: {
            detallepedidos: {
              include: {
                platos: true, // Incluye los productos del detalle del pedido
              },
            },
          },
        },
      },
    });

    if (pedidosMesas.length === 0 || !pedidosMesas[0].pedidos) {
      return NextResponse.json(
        { message: "Mesa sin pedido" },
        { status: 404 }
      );
    }

    // Agrupar los detalles del pedido
    const pedido = pedidosMesas[0].pedidos;
    const detalles = pedido!.detallepedidos.map((detalle) => ({
      DetalleID: detalle.DetalleID,
      PlatoID: detalle.PlatoID,
      descripcionPlato: detalle.platos.Descripcion,
      Cantidad: detalle.Cantidad,
      PrecioUnitario: detalle.platos.Precio,
    }));

    const total = detalles.reduce(
      (acc: number, detalle: any) =>
        acc + detalle.Cantidad * detalle.PrecioUnitario,
      0
    );

    const pedidoId = pedido!.PedidoID;

    const result = {
      PedidoID: pedidoId,
      detalles,
      total,
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: "Error al obtener los pedidos relacionados", error },
      { status: 500 }
    );
  }
}

const postSchema = yup.object({
  PedidoID: yup.number().required(),
  MesaID: yup.number().required(),
});

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const { PedidoID, MesaID } = await postSchema.validate(await req.json());

    const pedidoMesas = await prisma.pedido_mesas.create({
      data: {
        PedidoID,
        MesaID,
      },
    });

    return NextResponse.json(pedidoMesas);
  } catch (error) {
    return NextResponse.json(error, { status: 400 });
  }
}
