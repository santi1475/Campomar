"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Minus, Printer } from "lucide-react"

interface PlatoDetalle {
    DetalleID: number
    PlatoID: number
    descripcionPlato: string
    Cantidad: number
    PrecioUnitario: number
    Impreso: boolean
}

interface ModalIncrementarPlatosProps {
    isOpen: boolean
    onClose: () => void
    pedido: any
    onPlatoIncrement: (detalleId: number, cantidad: number) => Promise<void>
    onImprimirNuevos: (platosNuevos: any[], comentario: string) => Promise<void>
}

export default function ModalIncrementarPlatos({
    isOpen,
    onClose,
    pedido,
    onPlatoIncrement,
    onImprimirNuevos,
}: ModalIncrementarPlatosProps) {
    const [platosIncrement, setPlatosIncrement] = useState<{ [key: number]: number }>({})
    const [comentario, setComentario] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)

    const handleIncrementLocal = (detalleId: number) => {
        setPlatosIncrement((prev) => ({
            ...prev,
            [detalleId]: (prev[detalleId] || 0) + 1,
        }))
    }

    const handleDecrementLocal = (detalleId: number) => {
        setPlatosIncrement((prev) => ({
            ...prev,
            [detalleId]: Math.max((prev[detalleId] || 0) - 1, 0),
        }))
    }

    const getPlatosConIncrementos = () => {
        return Object.entries(platosIncrement)
            .filter(([_, cantidad]) => cantidad > 0)
            .map(([detalleId, cantidadExtra]) => {
                const detalle = pedido.detalles.find((d: PlatoDetalle) => d.DetalleID === Number.parseInt(detalleId))
                return {
                    DetalleID: Number.parseInt(detalleId),
                    PlatoID: detalle.PlatoID,
                    Descripcion: detalle.descripcionPlato,
                    Cantidad: cantidadExtra,
                    CantidadOriginal: detalle.Cantidad,
                    CantidadNueva: detalle.Cantidad + cantidadExtra,
                }
            })
    }

    const handleAplicarCambios = async () => {
        setIsProcessing(true)
        try {
            const platosConIncrementos = getPlatosConIncrementos()

            for (const plato of platosConIncrementos) {
                await onPlatoIncrement(plato.DetalleID, plato.Cantidad)
            }

            if (platosConIncrementos.length > 0) {
                await onImprimirNuevos(platosConIncrementos, comentario)
            }

            setPlatosIncrement({})
            setComentario("")
            onClose()
        } catch (error) {
            console.error("Error al aplicar cambios:", error)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleCancelar = () => {
        setPlatosIncrement({})
        setComentario("")
        onClose()
    }

    const totalIncrementos = Object.values(platosIncrement).reduce((sum, cant) => sum + cant, 0)
    const platosConIncrementos = getPlatosConIncrementos()
    const totalCosto = platosConIncrementos.reduce((sum, plato) => {
        const detalle = pedido.detalles.find((d: PlatoDetalle) => d.DetalleID === plato.DetalleID)
        return sum + (plato.Cantidad * detalle?.PrecioUnitario || 0)
    }, 0)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] max-w-2xl h-[90vh] max-h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col p-3 sm:p-6">
                <DialogHeader className="pb-2 sm:pb-4">
                    <DialogTitle className="text-base sm:text-lg font-semibold">
                        Incrementar Platos
                        {pedido && (
                            <span className="block text-xs sm:text-sm font-normal text-muted-foreground mt-1">
                                {pedido.mesas ? `Mesa(s): ${pedido.mesas.map((m: any) => m.NumeroMesa).join(", ")}` : "Para Llevar"}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4">
                    <div className="space-y-2 sm:space-y-3">
                        {pedido?.detalles?.map((detalle: PlatoDetalle) => {
                            const incrementoLocal = platosIncrement[detalle.DetalleID] || 0

                            return (
                                <div
                                    key={detalle.DetalleID}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-0"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm sm:text-base leading-tight">{detalle.descripcionPlato}</p>
                                        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-1">
                                            <span>Actual: {detalle.Cantidad}</span>
                                            <span>S/. {detalle.PrecioUnitario.toFixed(2)}</span>
                                            {incrementoLocal > 0 && (
                                                <span className="text-green-600 font-medium">
                                                    +{incrementoLocal} = {detalle.Cantidad + incrementoLocal}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center gap-2 sm:gap-1 sm:ml-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDecrementLocal(detalle.DetalleID)}
                                            disabled={incrementoLocal === 0}
                                            className="h-9 w-9 sm:h-7 sm:w-7 p-0 touch-manipulation"
                                        >
                                            <Minus className="h-4 w-4 sm:h-3 sm:w-3" />
                                        </Button>

                                        <span className="w-10 sm:w-8 text-center text-base sm:text-sm font-medium">{incrementoLocal}</span>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleIncrementLocal(detalle.DetalleID)}
                                            className="h-9 w-9 sm:h-7 sm:w-7 p-0 touch-manipulation"
                                        >
                                            <Plus className="h-4 w-4 sm:h-3 sm:w-3" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {totalIncrementos > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 text-sm sm:text-base">
                                <span className="font-medium">Total incrementos: {totalIncrementos}</span>
                                <span className="font-semibold text-green-700 text-lg sm:text-base">S/. {totalCosto.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-sm sm:text-base font-medium mb-2 block">Instrucciones para cocina:</label>
                        <Textarea
                            value={comentario}
                            onChange={(e) => setComentario(e.target.value)}
                            placeholder="Instrucciones especiales..."
                            className="min-h-[80px] sm:min-h-[60px] resize-none text-sm sm:text-base"
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 pt-4 sm:pt-3 border-t">
                    <Button
                        variant="outline"
                        onClick={handleCancelar}
                        disabled={isProcessing}
                        className="flex-1 bg-transparent h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
                    >
                        Cancelar
                    </Button>

                    <Button
                        onClick={handleAplicarCambios}
                        disabled={totalIncrementos === 0 || isProcessing}
                        className="flex-1 h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
                    >
                        {isProcessing ? (
                            "Procesando..."
                        ) : (
                            <>
                                <Printer className="w-4 h-4 sm:w-4 sm:h-4 mr-2" />
                                Aplicar ({totalIncrementos})
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
