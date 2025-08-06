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
      const configResponse = await fetch("/api/tunel_print");
      if (!configResponse.ok) {
        throw new Error("No se pudo obtener la configuración de la impresora.");
      }
      const config = await configResponse.json();
      const printerUrl = config.valor;

      if (!printerUrl) {
          throw new Error("La URL de la impresora no está configurada en la base de datos.");
      }

      const printResponse = await fetch(`${printerUrl}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoID: pedidoId, comentario }),
      })

      if (!printResponse.ok) {
        const errorData = await printResponse.json()
        throw new Error(errorData.message || "La impresora no respondió.")
      }
      
      console.log("Reimpresión enviada a la impresora.")
      setIsOpen(false)
    } catch (error) {
      console.error("Error al reimprimir:", error)
      alert(`Error al reimprimir: ${error instanceof Error ? error.message : "Ocurrió un error"}`)
    } finally {
      setIsPrinting(false)
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
