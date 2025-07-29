// src/app/api/print/kitchen-receipt/route.ts

import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ThermalPrinter, PrinterTypes, CharacterSet } from "node-thermal-printer";

export async function POST(req: NextRequest) {
  try {

    const { pedidoID, comentario } = await req.json();

    if (!pedidoID) {
      return NextResponse.json(
        { message: "Debe proporcionar un ID de pedido" },
        { status: 400 }
      );
    }

    const pedido = await prisma.pedidos.findUnique({
      where: { PedidoID: parseInt(pedidoID) },
      include: {
        detallepedidos: {
          include: {
            platos: true, 
          },
        },
        pedido_mesas: {
          include: {
            mesas: true,
          },
        },
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { message: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON, 
      interface: process.env.PRINTER_INTERFACE || "tcp://192.168.1.123:9100",
      characterSet: CharacterSet.PC850_MULTILINGUAL, 
      removeSpecialCharacters: false,
      lineCharacter: "-", 
    });

    printer.alignCenter();
    printer.bold(true);
    printer.println("PEDIDO DE COCINA");
    printer.bold(false);
    printer.drawLine();

    printer.alignLeft();
    printer.println(`Fecha: ${new Date(pedido.Fecha!).toLocaleDateString()} - Hora: ${new Date(pedido.Fecha!).toLocaleTimeString()}`);
    
    const mesasStr = pedido.pedido_mesas.map((pm) => pm.mesas?.NumeroMesa).join(", ");
    printer.setTextSize(1, 1);
    printer.bold(true);
    printer.println(`MESA(S): ${mesasStr}`);
    printer.setTextNormal();
    printer.bold(false);
    printer.drawLine();

    // Encabezado de la tabla con texto normal
    printer.setTextNormal();
    printer.tableCustom([
      { text: "CANT", align: "LEFT", width: 0.15, bold: true },
      { text: "PRODUCTO", align: "RIGHT", width: 0.80, bold: true },
    ]);

    // Aumentamos el tamaño para los detalles
    printer.setTextSize(1, 1); // Alto: 2, Ancho: 1 para mejor legibilidad
    pedido.detallepedidos.forEach((detalle) => {
      printer.tableCustom([
        { text: `${detalle.Cantidad}x`, align: "LEFT", width: 0.15 },
        { text: `${detalle.platos?.Descripcion}`, align: "LEFT", width: 0.85 },
      ]);
    });
    
    // Volvemos al tamaño normal para el resto
    printer.setTextNormal();
    printer.drawLine();

    if (comentario && comentario.trim() !== "") {
      printer.alignCenter();
      printer.bold(true);
      printer.println("! INSTRUCCIONES !");
      printer.bold(false);
      printer.println(comentario);
      printer.drawLine();
    }
    
    printer.cut();

    await printer.execute();

    return NextResponse.json({
      success: true,
      message: "Comanda enviada a la impresora.",
    });

  } catch (error) {
    console.error("ERROR EN API DE IMPRESIÓN:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { success: false, error: "Error al imprimir la comanda.", details: errorMessage },
      { status: 500 }
    );
  }
}