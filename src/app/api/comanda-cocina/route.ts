import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { pedidoID, comentario, detalles } = await req.json();

    if (!pedidoID) {
      return NextResponse.json({ message: "PedidoID es requerido" }, { status: 400 });
    }

    let comentarioCompleto = comentario || "";
    let tipoComanda = "normal"; // normal, reimpresion, solo_nuevos
    
    if (detalles && detalles.length > 0) {
      // Obtener las descripciones de los platos desde la base de datos
      const platosIds = detalles.map((d: any) => d.PlatoID);
      const platosInfo = await prisma.platos.findMany({
        where: {
          PlatoID: {
            in: platosIds
          }
        },
        select: {
          PlatoID: true,
          Descripcion: true
        }
      });

      // Crear un mapa para acceso rápido
      const platosMap = new Map(platosInfo.map(p => [p.PlatoID, p.Descripcion]));

      // Generar la descripción de platos específicos con las descripciones correctas
      const platosEspecificos = detalles.map((d: any) => {
        const descripcion = platosMap.get(d.PlatoID) || 'Plato no encontrado';
        return `${d.Cantidad}x ${descripcion}`;
      }).join(", ");

      // Información técnica para la app puente (no visible al usuario)
      const infoTecnica = `REIMPRESIÓN - Solo: ${platosEspecificos}`;
      // Solo el comentario del usuario (visible)
      comentarioCompleto = `${infoTecnica}${comentario ? ` | ${comentario}` : ""}`;
      tipoComanda = "reimpresion";
      
      console.log("🖨️ Generando comanda para platos específicos (reimpresión):", {
        pedidoID,
        detallesRecibidos: detalles,
        platosInfo,
        platosEspecificos,
        comentarioUsuario: comentario,
        comentarioCompleto
      });
    } else {
      // Cuando no se especifican detalles, siempre generar comanda normal completa
      // para dar control total al usuario sobre cuándo imprimir
      comentarioCompleto = comentario || "";
      tipoComanda = "normal";
      
      console.log("🖨️ Generando comanda normal (todos los platos) por solicitud del usuario:", {
        pedidoID,
        comentarioCompleto,
        nota: "Comanda completa solicitada - no se aplica detección automática de platos nuevos"
      });
    }

    const nuevaComanda = await prisma.comandas_cocina.create({
      data: {
        PedidoID: pedidoID,
        Comentario: comentarioCompleto,
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

    // Nota: No se marcan platos como impresos automáticamente
    // El usuario tiene control total sobre cuándo imprimir

    return NextResponse.json({
      ...nuevaComanda,
      tipoComanda
    });
  } catch (error) {
    console.error("Error al crear la comanda:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}