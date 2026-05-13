import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { PedidoEstado } from "@prisma/client";
import { CreatePedidoMesaSchema, parseJson } from "@/app/api/_lib/dto";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mesasParam = searchParams.get("mesas");

  if (!mesasParam) {
    return NextResponse.json({ message: "No se proporcionaron mesas" }, { status: 400 });
  }

  const mesasArray = mesasParam
    .split(",")
    .map((s) => Number.parseInt(s, 10))
    .filter((n) => Number.isFinite(n));

  try {
    const pedidoActivo = await prisma.pedidos.findFirst({
      where: {
        Estado: 'Activo', // El pedido debe estar activo
        pedido_mesas: {
          some: { MesaID: { in: mesasArray } },
        },
      },
      include: {
        detallepedidos: { include: { platos: true } },
        empleados: true,
      },
    });

    if (!pedidoActivo) {
      return NextResponse.json({ message: "Mesa sin pedido activo" }, { status: 404 });
    }

    const detalles = pedidoActivo.detallepedidos.map((detalle) => {
      const precioNormal = Number(detalle.platos?.Precio) || 0;
      const precioLlevar = Number(detalle.platos?.PrecioLlevar) || 0;
      const precioUnitario = detalle.ParaLlevar && precioLlevar > 0 ? precioLlevar : precioNormal;

      return {
        DetalleID: detalle.DetalleID,
        PlatoID: detalle.PlatoID,
        descripcionPlato: detalle.platos?.Descripcion || "Plato no encontrado",
        Cantidad: detalle.Cantidad,
        PrecioUnitario: precioUnitario,
        Impreso: detalle.Impreso,
        ParaLlevar: detalle.ParaLlevar,
      };
    });

    const total = detalles.reduce(
      (acc, detalle) => acc + detalle.Cantidad * detalle.PrecioUnitario,
      0
    );

    return NextResponse.json({
      PedidoID: pedidoActivo.PedidoID,
      EmpleadoID: pedidoActivo.EmpleadoID,
      MozoNombre: pedidoActivo.empleados?.Nombre || null,
      detalles,
      total,
      TipoPago: pedidoActivo.TipoPago ?? null,
      Estado: pedidoActivo.Estado,
    });
  } catch (error) {
    console.error("Error al obtener los detalles del pedido:", error);
    return NextResponse.json(
      { message: "Error al obtener los pedidos relacionados", error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, CreatePedidoMesaSchema);
  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message, details: parsed.details }, { status: parsed.status });
  }
  try {
    const pedidoMesas = await prisma.pedido_mesas.create({ data: parsed.data });
    return NextResponse.json(pedidoMesas, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error al crear pedido_mesas", error: String(error) }, { status: 500 });
  }
}
