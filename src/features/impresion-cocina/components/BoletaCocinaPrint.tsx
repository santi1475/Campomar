"use client"

import type React from "react"

import { useRef, useState } from "react"
import { useReactToPrint } from "react-to-print"
import BoletaCocina from "@/features/impresion-cocina/components/ComandaCocina"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Printer } from "lucide-react"

interface BoletaCocinaImprimirProps {
  mesas: {
    NumeroMesa: number
  }[]
  orderItems: {
    PlatoID: number
    Descripcion: string
    Cantidad: number
  }[]
  triggerButton?: React.ReactNode
  comentario?: string // Nuevo: comentario opcional
}

export default function BoletaCocinaImprimir({ mesas, orderItems, triggerButton, comentario }: BoletaCocinaImprimirProps) {
  const [isOpen, setIsOpen] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  // Configuración de impresión
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Boleta-Cocina-Mesa-${mesas.map((m) => m.NumeroMesa).join("-")}`,
    onAfterPrint: () => {
      console.log("Impresión completada.")
      setIsOpen(false) // Cierra el diálogo después de imprimir
    },
  })

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
          {/* Boleta de Cocina */}
          <BoletaCocina ref={receiptRef} orderItems={orderItems} mesas={mesas} comentario={comentario} />
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => handlePrint()}>
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

