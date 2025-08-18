"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Printer, ShoppingCart } from "lucide-react"
import BoletaCocina from "@/features/impresion-cocina/components/BoletaCocina";

interface BoletaCocinaModalProps {
  mode: 'crear' | 'reimprimir'
  pedidoId?: number
  mesas: {
    NumeroMesa: number
  }[]
  orderItems: {
    PlatoID: number
    Descripcion: string
    Cantidad: number
  }[]
  handleRealizarPedido?: () => Promise<number | null>
  triggerButton?: React.ReactNode
  initialComentario?: string
}

export default function BoletaCocinaModal({
  mode,
  pedidoId,
  mesas,
  orderItems,
  handleRealizarPedido,
  triggerButton,
  initialComentario = "",
}: BoletaCocinaModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [comentario, setComentario] = useState(initialComentario || "")
  const [showComentarioInput, setShowComentarioInput] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  const handleFinalizeAndPrint = async () => {
    if (mode !== 'crear' || !handleRealizarPedido) return
    
    setIsSubmitting(true)
    try {
      const pedidoID = await handleRealizarPedido()

      if (!pedidoID) {
        throw new Error("No se pudo crear el pedido.")
      }

      const comandaResponse = await fetch('/api/comanda-cocina', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedidoID,
          comentario,
        }),
      })

      if (!comandaResponse.ok) {
        const error = await comandaResponse.json()
        throw new Error(error.message || 'Error al crear la comanda')
      }

      const comanda = await comandaResponse.json()
      console.log(`✅ Pedido ${pedidoID} creado y comanda ${comanda.ComandaID} generada para impresión.`)
      setIsOpen(false)
    } catch (error) {
      console.error("Error en el proceso:", error)
      alert(`Error: ${error instanceof Error ? error.message : "Ocurrió un error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReprint = async () => {
    if (mode !== 'reimprimir' || !pedidoId) return
    
    setIsSubmitting(true)
    try {
      console.log(`Creando comanda para reimpresión del pedido ${pedidoId}...`)
      
      const comandaResponse = await fetch('/api/comanda-cocina', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedidoID: pedidoId,
          comentario,
        }),
      })

      if (!comandaResponse.ok) {
        const error = await comandaResponse.json()
        throw new Error(error.message || 'Error al crear la comanda')
      }

      const comanda = await comandaResponse.json()
      console.log(`✅ Comanda ${comanda.ComandaID} creada exitosamente para el pedido ${pedidoId}`)

      setIsOpen(false)
    } catch (error) {
      console.error("❌ Error en el proceso:", error)
      alert(`Error al reimprimir: ${error instanceof Error ? error.message : "Ocurrió un error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAction = mode === 'crear' ? handleFinalizeAndPrint : handleReprint

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button
            size="lg"
            className="w-full"
            onClick={() => setIsOpen(true)}
            disabled={orderItems.length === 0}
          >
            {mode === 'crear' ? (
              <><ShoppingCart className="w-5 h-5 mr-2" /> Realizar Pedido</>
            ) : (
              <><Printer className="w-4 h-4 mr-2" /> Imprimir Boleta</>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Boleta de Cocina - Mesa(s) {mesas.map((mesa) => mesa.NumeroMesa).join(", ")}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 max-h-[80vh] overflow-y-auto">
          <BoletaCocina
            ref={receiptRef}
            orderItems={orderItems}
            mesas={mesas}
            comentario={comentario}
          />
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {!showComentarioInput ? (
            <Button
              variant="secondary"
              onClick={() => setShowComentarioInput(true)}
            >
              Agregar instrucción para cocina
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <textarea
                className="border rounded p-2 w-full"
                rows={2}
                placeholder="Escribe una instrucción para la cocina..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setComentario("")
                    setShowComentarioInput(false)
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowComentarioInput(false)}
                  disabled={comentario.trim() === ""}
                >
                  Guardar instrucción
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cerrar
          </Button>
          <Button
            onClick={handleAction}
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? "Procesando..." 
              : mode === 'crear' 
                ? "Finalizar e Imprimir"
                : "Reimprimir"
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
