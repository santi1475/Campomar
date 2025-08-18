import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { pedidoID, comentario } = await req.json();

    if (!pedidoID) {
      return NextResponse.json({ message: "PedidoID es requerido" }, { status: 400 });
    }

    const nuevaComanda = await prisma.comandas_cocina.create({
      data: {
        PedidoID: pedidoID,
        Comentario: comentario,
        EstadoImpresion: "pendiente",
      },
      include: {
        pedido: {
          include: {
            detallepedidos: {
              include: {
                platos: true
              }
            },
            pedido_mesas: {
              include: {
                mesas: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(nuevaComanda);
  } catch (error) {
    console.error("Error al crear la comanda:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}