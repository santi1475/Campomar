"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { ShoppingCart, Receipt, Utensils, Check } from "lucide-react"

interface DetallePedido {
  DetalleID: number
  PlatoID: number
  descripcionPlato: string
  Cantidad: number
  PrecioUnitario: number
  ParaLlevar?: boolean // Agregado para indicar si es para llevar
}

interface PedidoData {
  PedidoID: number
  detalles: DetallePedido[]
  total: number
  TipoPago?: number | null
  Estado?: boolean
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
  const [tipoPago, setTipoPago] = useState<number | null>(null)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const router = useRouter()

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
      // Inicializar select con TipoPago existente si lo hay
      if (data?.TipoPago) {
        setTipoPago(data.TipoPago)
      } else {
        setTipoPago(null)
      }
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
      setTipoPago(null) // Resetear tipo de pago al cerrar
    }
  }

  const procesarPago = async () => {
    if (!pedidoData || !tipoPago) return
    // Evitar reprocesar si ya está cerrado
    if (pedidoData.Estado === false) {
      setError("El pedido ya fue cerrado anteriormente.")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/pedidos/${pedidoData.PedidoID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Estado: false,
          TipoPago: tipoPago,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al procesar el pago")
      }

      // Éxito
  // Refrescar datos localmente antes de cerrar para mejor UX
  setPedidoData({ ...pedidoData, Estado: false, TipoPago: tipoPago })
  handleOpenChange(false)
  router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al pagar")
    } finally {
      setLoading(false)
      setIsConfirmDialogOpen(false)
    }
  }

  const handlePagarPedido = () => {
    if (!tipoPago) {
      alert("Por favor, selecciona un método de pago.")
      return
    }
    setIsConfirmDialogOpen(true)
  }

  const buttonColor = (() => {
    switch (tipoPago) {
      case 1:
        return "bg-[#00631b] hover:bg-[#00631b]/90"
      case 2:
        return "bg-[#931194] hover:bg-[#931194]/90"
      case 3:
        return "bg-[#f7762c] hover:bg-[#f7762c]/90"
      default:
        return ""
    }
  })()

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
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {pedidoData.detalles.length} plato{pedidoData.detalles.length !== 1 ? "s" : ""}
                    </Badge>
                    {pedidoData.Estado === false && (
                      <Badge className="bg-green-600 hover:bg-green-600 text-white">Pagado</Badge>
                    )}
                  </div>
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
                        <TableCell className="font-medium">
                          {detalle.descripcionPlato}
                          {detalle.ParaLlevar && (
                            <Badge variant="outline" className="ml-2 bg-orange-100 text-orange-700 border-orange-200">Para Llevar</Badge>
                          )}
                        </TableCell>
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
                <Separator className="mt-4" />
              </CardContent>
            </Card>

            {/* Sección de Pago */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-end">
                  <Select
                    onValueChange={(value) => setTipoPago(Number(value))}
                    value={tipoPago?.toString() || ""}
                    disabled={pedidoData.Estado === false}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Efectivo</SelectItem>
                      <SelectItem value="2">Yape</SelectItem>
                      <SelectItem value="3">POS</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handlePagarPedido}
                    disabled={!tipoPago || loading || pedidoData.Estado === false}
                    className={`w-full sm:w-auto h-12 px-8 ${buttonColor} transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold`}
                  >
                    <Check className="w-5 h-5 mr-2" />
                    {pedidoData.Estado === false ? "Ya Pagado" : "Pagar Pedido"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>

      {/* Diálogo de confirmación de pago */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Pago</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas procesar el pago? Esta acción marcará el pedido como completado y liberará
              la(s) mesa(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={procesarPago} disabled={loading}>
              {loading ? "Procesando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
