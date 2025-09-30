import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import * as yup from "yup";

// --- GET para obtener detalles de un pedido activo para ciertas mesas ---
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mesasParam = searchParams.get("mesas");

  if (!mesasParam) {
    return NextResponse.json({ message: "No se proporcionaron mesas" }, { status: 400 });
  }

  const mesasArray = mesasParam.split(",").map(Number);

  try {
    // La lógica se invierte: buscamos el pedido activo que contenga CUALQUIERA de las mesas.
    const pedidoActivo = await prisma.pedidos.findFirst({
      where: {
        Estado: true, // El pedido debe estar activo
        pedido_mesas: {
          some: {
            MesaID: {
              in: mesasArray,
            },
          },
        },
      },
      include: {
        detallepedidos: {
          include: {
            platos: true, // Incluye los datos del plato
          },
        },
        empleados: true, // Incluimos los datos del mozo que creó el pedido
      },
    });

    if (!pedidoActivo) {
      return NextResponse.json({ message: "Mesa sin pedido activo" }, { status: 404 });
    }

    // Formateamos la respuesta como la aplicación la espera
    const detalles = pedidoActivo.detallepedidos.map((detalle) => {
      const precioNormal = Number(detalle.platos?.Precio) || 0;
      const precioLlevar = Number(detalle.platos?.PrecioLlevar) || 0;
      
      // Determina el precio correcto a usar para este item
      const precioUnitario = (detalle.ParaLlevar && precioLlevar > 0) ? precioLlevar : precioNormal;

      return {
        DetalleID: detalle.DetalleID,
        PlatoID: detalle.PlatoID,
        descripcionPlato: detalle.platos?.Descripcion || "Plato no encontrado",
        Cantidad: detalle.Cantidad,
        PrecioUnitario: precioUnitario, // Precio correcto
        Impreso: detalle.Impreso,
        ParaLlevar: detalle.ParaLlevar, // Enviar el flag
      };
    });

    const total = detalles.reduce(
      (acc, detalle) => acc + detalle.Cantidad * detalle.PrecioUnitario,
      0
    );

    const resultado = {
      PedidoID: pedidoActivo.PedidoID,
      EmpleadoID: pedidoActivo.EmpleadoID, // ID del mozo que creó el pedido
      MozoNombre: pedidoActivo.empleados?.Nombre || null, // Nombre del mozo creador
      detalles,
      total,
      TipoPago: pedidoActivo.TipoPago ?? null,
      Estado: pedidoActivo.Estado,
    };

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Error al obtener los detalles del pedido:", error);
    return NextResponse.json(
      { message: "Error al obtener los pedidos relacionados", error },
      { status: 500 }
    );
  }
}

// --- POST para asociar una mesa a un pedido ---
const postSchema = yup.object({
  PedidoID: yup.number().required(),
  MesaID: yup.number().required(),
});

export async function POST(req: NextRequest) {
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