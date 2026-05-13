import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const alertas = await prisma.auditoria_eliminaciones.findMany({
      orderBy: { Fecha: "desc" },
      take: 50,
      include: {
        empleados: { select: { Nombre: true } },
        pedidos: {
          include: {
            pedido_mesas: { include: { mesas: true } },
          },
        },
      },
    });

    const formattedAlerts = alertas.map((alerta) => {
      const mesasNum =
        alerta.pedidos?.pedido_mesas
          ?.map((pm) => pm.mesas?.NumeroMesa)
          .filter((n): n is number => typeof n === "number")
          .join(", ") || "";

      const table = mesasNum.length > 0 ? `Mesa ${mesasNum}` : "Para Llevar";

      return {
        id: alerta.ID.toString(),
        dateTime: new Date(alerta.Fecha).toLocaleString("es-PE", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        table,
        waiter: alerta.empleados?.Nombre || "Desconocido",
        deletedItem: alerta.DescripcionPlato,
        quantity: alerta.CantidadEliminada,
        lostAmount: Number(alerta.TotalPerdido),
        orderId: `ORD-${alerta.PedidoID}`,
      };
    });

    return NextResponse.json(formattedAlerts);
  } catch (error) {
    console.error("[API superAdmin/alerts] error", error);
    return NextResponse.json({ error: "Error fetching alerts" }, { status: 500 });
  }
}
