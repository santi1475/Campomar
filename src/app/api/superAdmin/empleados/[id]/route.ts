import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface Segments {
  params: { id: string };
}

export async function GET(_request: Request, { params }: Segments) {
  try {
    const empleadoId = Number.parseInt(params.id, 10);

    if (!Number.isFinite(empleadoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const historial = await prisma.auditoria_eliminaciones.findMany({
      where: { EmpleadoID: empleadoId },
      orderBy: { Fecha: "desc" },
      include: { mesas: true },
    });

    const formattedHistory = historial.map((item) => {
      const fechaObj = new Date(item.Fecha);
      const monto = Number(item.TotalPerdido);
      let risk: "high" | "medium" | "low" = "low";
      if (monto > 50) risk = "high";
      else if (monto > 20) risk = "medium";

      return {
        id: item.ID.toString(),
        date: fechaObj.toLocaleDateString("es-PE"),
        time: fechaObj.toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        table: item.mesas ? `Mesa ${item.mesas.NumeroMesa}` : "Para Llevar",
        action:
          item.TipoAccion === "ELIMINACION_TOTAL" ? "deletion" : "correction",
        item: item.DescripcionPlato,
        amount: monto,
        risk,
      };
    });

    return NextResponse.json(formattedHistory);
  } catch (error) {
    console.error("[API superAdmin/empleados/[id]] error", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
