"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Receipt, Utensils } from "lucide-react"

interface DetallePedido {
  DetalleID: number
  PlatoID: number
  descripcionPlato: string
  Cantidad: number
  PrecioUnitario: number
}

interface PedidoData {
  PedidoID: number
  detalles: DetallePedido[]
  total: number
}

interface PedidosModalProps {
  mesas: number[]
  triggerText?: string
}

export default function PedidosModal({ mesas, triggerText = "Ver Pedido" }: PedidosModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [pedidoData, setPedidoData] = useState<PedidoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPedidoData = async () => {
    setLoading(true)
    setError(null)

    try {
      const mesasParam = mesas.join(",")
      const response = await fetch(`/api/pedido_mesas?mesas=${mesasParam}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al obtener los datos")
      }

      const data = await response.json()
      setPedidoData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      fetchPedidoData()
    } else {
      setPedidoData(null)
      setError(null)
    }
  }

   const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", { // Cambiado a locale de Perú
      style: "currency",
      currency: "PEN", // Cambiado a Sol Peruano
    }).format(amount)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Receipt className="h-4 w-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Detalles del Pedido - Mesa{mesas.length > 1 ? "s" : ""} {mesas.join(", ")}
          </DialogTitle>
          <DialogDescription>
            Información detallada del pedido activo para la{mesas.length > 1 ? "s" : ""} mesa
            {mesas.length > 1 ? "s" : ""} seleccionada{mesas.length > 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Cargando pedido...</span>
          </div>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <span className="font-medium">Alerta:</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {pedidoData && !loading && !error && (
          <div className="space-y-6">
            {/* Header del pedido */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Utensils className="h-5 w-5" />
                    Pedido #{pedidoData.PedidoID}
                  </span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {pedidoData.detalles.length} plato{pedidoData.detalles.length !== 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Tabla de detalles */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles del Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plato</TableHead>
                      <TableHead className="text-center">Cantidad</TableHead>
                      <TableHead className="text-right">Precio Unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedidoData.detalles.map((detalle) => (
                      <TableRow key={detalle.DetalleID}>
                        <TableCell className="font-medium">{detalle.descripcionPlato}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{detalle.Cantidad}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(detalle.PrecioUnitario)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(detalle.Cantidad * detalle.PrecioUnitario)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Total */}
            <Card>
              <CardContent className="pt-6">
                <Separator className="mb-4" />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total del Pedido:</span>
                  <span className="text-2xl text-primary">{formatCurrency(pedidoData.total)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
