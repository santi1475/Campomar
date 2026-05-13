import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { CreateComandaCocinaSchema, parseJson } from "@/app/api/_lib/dto";

export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, CreateComandaCocinaSchema);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.message, details: parsed.details },
      { status: parsed.status }
    );
  }

  const { pedidoID, comentario, detalles } = parsed.data;
  const tieneDetalles = Array.isArray(detalles) && detalles.length > 0;
  const tipoComanda = tieneDetalles ? "nuevos_platos" : "normal";

  try {
    const nuevaComanda = await prisma.$transaction(async (tx) => {
      const comanda = await tx.comandas_cocina.create({
        data: {
          PedidoID: pedidoID,
          Comentario: comentario ?? "",
          EstadoImpresion: "pendiente",
        },
        include: {
          pedidos: {
            include: {
              detallepedidos: { include: { platos: true } },
              pedido_mesas: { include: { mesas: true } },
            },
          },
        },
      });

      if (tieneDetalles && detalles) {
        await tx.detalle_comandas.createMany({
          data: detalles.map((d) => ({
            ComandaID: comanda.ComandaID,
            PlatoID: d.PlatoID,
            Cantidad: d.Cantidad,
            ParaLlevar: d.ParaLlevar ?? false,
          })),
        });

        const platosIds = detalles.map((d) => d.PlatoID);
        await tx.detallepedidos.updateMany({
          where: {
            PedidoID: pedidoID,
            PlatoID: { in: platosIds },
            Impreso: false,
          },
          data: { Impreso: true },
        });
      } else {
        await tx.detallepedidos.updateMany({
          where: { PedidoID: pedidoID },
          data: { Impreso: true },
        });
      }

      return comanda;
    });

    return NextResponse.json({ ...nuevaComanda, tipoComanda });
  } catch (error) {
    console.error("[API comanda-cocina] error", error);
    return NextResponse.json(
      { message: "Error interno del servidor", error: String(error) },
      { status: 500 }
    );
  }
}
