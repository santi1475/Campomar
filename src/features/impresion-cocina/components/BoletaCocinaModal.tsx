"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Printer, ShoppingCart, Eye, EyeOff } from "lucide-react"
import BoletaCocina from "@/features/impresion-cocina/components/BoletaCocina"

interface OrderItem {
  PlatoID: number
  Descripcion: string
  Cantidad: number
  DetalleID?: number // Solo presente en modo reimprimir
}

interface BoletaCocinaModalProps {
  mode: "crear" | "reimprimir"
  pedidoId?: number
  mesas: {
    NumeroMesa: number
  }[]
  orderItems: OrderItem[]
  handleRealizarPedido?: () => Promise<number | null>
  triggerButton?: React.ReactNode
  initialComentario?: string
  onPrintSuccess?: () => void
}

export default function BoletaCocinaModal({
  mode,
  pedidoId,
  mesas,
  orderItems,
  handleRealizarPedido,
  triggerButton,
  initialComentario = "",
  onPrintSuccess,
}: BoletaCocinaModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [comentario, setComentario] = useState(initialComentario || "")
  const [isInstruccionModalOpen, setIsInstruccionModalOpen] = useState(false)
  const [isEditingInstruccion, setIsEditingInstruccion] = useState(false)
  const [showPreviewOnMobile, setShowPreviewOnMobile] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  const handleFinalizeAndPrint = async () => {
    if (mode !== "crear" || !handleRealizarPedido) return

    setIsSubmitting(true)
    try {
      const pedidoID = await handleRealizarPedido()

      if (!pedidoID) {
        throw new Error("No se pudo crear el pedido.")
      }

      const comandaResponse = await fetch("/api/comanda-cocina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidoID,
          comentario,
        }),
      })

      if (!comandaResponse.ok) {
        const error = await comandaResponse.json()
        throw new Error(error.message || "Error al crear la comanda")
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
    if (mode !== "reimprimir" || !pedidoId) return

    setIsSubmitting(true)
    try {
      // Primero enviamos la comanda para los platos nuevos
      console.log(`Creando comanda para los nuevos platos del pedido ${pedidoId}...`)

      const comandaResponse = await fetch("/api/comanda-cocina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidoID: pedidoId,
          comentario,
          detalles: orderItems.map(item => ({
            PlatoID: item.PlatoID,
            Cantidad: item.Cantidad
          }))
        }),
      })

      if (!comandaResponse.ok) {
        const error = await comandaResponse.json()
        throw new Error(error.message || "Error al crear la comanda")
      }

      const comanda = await comandaResponse.json()
      console.log(`✅ Comanda ${comanda.ComandaID} creada exitosamente para el pedido ${pedidoId}`)

      // Actualizamos el estado de los platos a impreso

      const detalleIds = orderItems
        .map(item => item.DetalleID)
        .filter((id): id is number => typeof id === "number")

      if (!detalleIds.length) {
        alert("No hay platos nuevos para marcar como impresos. Verifica que los items tengan DetalleID válido.");
        setIsSubmitting(false);
        return;
      }

      const actualizarResponse = await fetch(`/api/pedido-platos/${pedidoId}/marcar-impresos`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          detalleIds
        })
      })

      if (!actualizarResponse.ok) {
        const error = await actualizarResponse.json();
        console.error("Error al marcar como impresos:", error);
        throw new Error(error.message || "Error al actualizar el estado de los platos")
      }

      setIsOpen(false)
      
      // Llamar al callback de éxito si está definido
      if (onPrintSuccess) {
        onPrintSuccess()
      }
    } catch (error) {
      console.error("❌ Error en el proceso:", error)
      alert(`Error al reimprimir: ${error instanceof Error ? error.message : "Ocurrió un error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAction = mode === "crear" ? handleFinalizeAndPrint : handleReprint

  const handleStartEditingInstruccion = () => {
    setIsEditingInstruccion(true)
    setShowPreviewOnMobile(false)
  }

  const handleSaveInstruccion = () => {
    setIsEditingInstruccion(false)
    setShowPreviewOnMobile(false)
  }

  const handleCancelInstruccion = () => {
    setComentario(initialComentario || "")
    setIsEditingInstruccion(false)
    setShowPreviewOnMobile(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button size="lg" className="w-full" onClick={() => setIsOpen(true)} disabled={orderItems.length === 0}>
            {mode === "crear" ? (
              <>
                <ShoppingCart className="w-5 h-5 mr-2" /> Realizar Pedido
              </>
            ) : (
              <>
                <Printer className="w-4 h-4 mr-2" /> Imprimir Boleta
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={`w-[95vw] ${isEditingInstruccion ? "max-w-6xl" : "max-w-3xl"} max-h-[95vh] p-3 sm:p-6`}>
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="text-sm sm:text-base md:text-lg text-balance leading-tight">
            {isEditingInstruccion ? "Agregar Instrucción - " : ""}Boleta de Cocina - Mesa(s){" "}
            {mesas.map((mesa) => mesa.NumeroMesa).join(", ")}
          </DialogTitle>
        </DialogHeader>

        {!isEditingInstruccion ? (
          <div className="flex flex-col h-[70vh]">
            <div className="flex-1 overflow-y-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <BoletaCocina ref={receiptRef} orderItems={orderItems} mesas={mesas} comentario={comentario} />
            </div>
            <div className="mt-2">
              <div className="flex flex-col gap-2 border-t pt-2">
                <div className="flex items-center justify-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs sm:text-sm"
                    onClick={handleStartEditingInstruccion}
                  >
                    {comentario ? "Editar instrucción" : "Agregar instrucción para cocina"}
                  </Button>
                  {comentario && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setComentario("")}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
                {comentario && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                    <strong>Instrucción:</strong> {comentario}
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm order-2 sm:order-1 bg-transparent"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  Cerrar
                </Button>
                <Button
                  size="sm"
                  className="text-xs sm:text-sm order-1 sm:order-2"
                  onClick={handleAction}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Procesando..." : mode === "crear" ? "Finalizar e Imprimir" : "Reimprimir"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4 h-[70vh]">
            <div className={`flex flex-col gap-3 ${showPreviewOnMobile ? "hidden lg:flex" : "flex"} lg:w-1/2`}>
              <div className="flex items-center justify-between lg:hidden">
                <h3 className="text-sm font-medium">Escribir instrucción</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreviewOnMobile(!showPreviewOnMobile)}
                  className="text-xs"
                >
                  {showPreviewOnMobile ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreviewOnMobile ? "Ocultar" : "Ver"} Vista Previa
                </Button>
              </div>
              <Textarea
                value={comentario}
                onChange={(e: { target: { value: React.SetStateAction<string> } }) => setComentario(e.target.value)}
                placeholder="Escribe las instrucciones especiales para la cocina..."
                className="flex-1 min-h-[200px] lg:min-h-[300px] text-sm resize-none"
                autoFocus
              />
              <div className="text-xs text-gray-500">{comentario.length} caracteres</div>
            </div>

            <div className={`flex flex-col gap-3 ${!showPreviewOnMobile ? "hidden lg:flex" : "flex"} lg:w-1/2`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium hidden lg:block">Vista previa</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreviewOnMobile(!showPreviewOnMobile)}
                  className="text-xs lg:hidden"
                >
                  <EyeOff className="w-4 h-4 mr-1" />
                  Ocultar Vista Previa
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto border rounded-lg p-3 bg-white">
                <BoletaCocina orderItems={orderItems} mesas={mesas} comentario={comentario} />
              </div>
            </div>
          </div>
        )}

        {isEditingInstruccion && (
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm order-2 sm:order-1 bg-transparent"
              onClick={handleCancelInstruccion}
            >
              Cancelar
            </Button>
            <Button size="sm" className="text-xs sm:text-sm order-1 sm:order-2" onClick={handleSaveInstruccion}>
              Guardar Instrucción
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
