"use client"

import type React from "react"
import { useRef, useState } from "react"
import BoletaCocina from "@/features/impresion-cocina/components/ComandaCocina"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Printer } from "lucide-react"

interface BoletaCocinaImprimirProps {
  pedidoId: number;
  mesas: {
    NumeroMesa: number
  }[]
  orderItems: {
    PlatoID: number
    Descripcion: string
    Cantidad: number
  }[]
  triggerButton?: React.ReactNode
  comentario?: string
}

export default function BoletaCocinaImprimir({ pedidoId, mesas, orderItems, triggerButton, comentario }: BoletaCocinaImprimirProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  const handleReprint = async () => {
    if (!pedidoId) {
      alert("Error: No se proporcionó un ID de pedido para reimprimir.")
      return
    }
    setIsPrinting(true)
    try {
      console.log(`Reimprimiendo pedido ${pedidoId}...`);
      
      console.log('Esperando 1 segundo para asegurar consistencia...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const configResponse = await fetch("/api/tunel_print");
      if (!configResponse.ok) {
        throw new Error("No se pudo obtener la configuración de la impresora.");
      }
      
      const config = await configResponse.json();
      const printerUrl = config.valor;

      if (!printerUrl) {
        throw new Error("La URL de la impresora no está configurada en la base de datos.");
      }

      // Validar que la URL es válida y está accesible
      try {
        console.log(`Verificando conexión con la impresora en ${printerUrl}...`);
        const checkResponse = await fetch(printerUrl);
        if (!checkResponse.ok) {
          throw new Error("No se pudo conectar con el servidor de impresión.");
        }
      } catch (error) {
        throw new Error("El servidor de impresión no está disponible. Verifica la URL y que el servidor esté en funcionamiento.");
      }

      console.log(`Enviando pedido ${pedidoId} a impresora...`);
      const printResponse = await fetch(`${printerUrl}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoID: pedidoId, comentario }),
      });

      if (!printResponse.ok) {
        // Intentar leer el error como JSON primero
        let errorMessage;
        const contentType = printResponse.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await printResponse.json();
          errorMessage = errorData.message;
        } else {
          // Si no es JSON, leer como texto
          const errorText = await printResponse.text();
          errorMessage = "Error del servidor de impresión. Por favor, verifica la configuración.";
        }
        throw new Error(errorMessage || "La impresora no respondió correctamente.");
      }
      
      console.log("✅ Comanda reenviada a la impresora exitosamente.");
      setIsOpen(false);
    } catch (error) {
      console.error("❌ Error en el proceso:", error);
      alert(`Error al reimprimir: ${error instanceof Error ? error.message : "Ocurrió un error"}`);
    } finally {
      setIsPrinting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm" className="flex items-center gap-2" disabled={orderItems.length === 0}>
            <Printer className="w-4 h-4" /> Imprimir Boleta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Boleta de Cocina - Mesa(s) {mesas.map((mesa) => mesa.NumeroMesa).join(", ")}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 max-h-[70vh] overflow-y-auto bg-white p-1 rounded">
          <BoletaCocina ref={receiptRef} orderItems={orderItems} mesas={mesas} comentario={comentario} />
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isPrinting}>
            Cancelar
          </Button>
          <Button onClick={handleReprint} disabled={isPrinting}>
            <Printer className="w-4 h-4 mr-2" /> {isPrinting ? "Imprimiendo..." : "Reimprimir"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
