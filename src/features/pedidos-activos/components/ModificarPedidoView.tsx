"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEmpleadoStore } from "@/store/empleado"
import type { empleados, mesas } from "@prisma/client"
import { X, PlusIcon, MinusIcon, Trash2, Printer, Check, ChevronDown, ChevronUp } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { MesaOcupadaAgregar } from "./ModalAgregarPlato"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import BoletaCocinaModal from "@/features/impresion-cocina/components/BoletaCocinaModal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export const MesaOcupada = () => {
  const empleado: empleados = useEmpleadoStore((state: any) => state.empleado)
  const router = useRouter()
  const searchParams = useSearchParams()
  const mesasParam = searchParams.get("mesas")
  const [selectedTables, setSelectedTables] = useState<mesas[]>([])
  const [pedido, setPedido] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [tipoPago, setTipoPago] = useState<number | null>(null)
  const [isPlatosOpen, setIsPlatosOpen] = useState<boolean>(false)

  const fetchPedido = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/pedido_mesas?mesas=${mesasParam}`)
      if (response.status === 404) {
        setPedido(null)
        return
      }
      if (!response.ok) {
        throw new Error("Error al obtener el pedido")
      }
      const data = await response.json()
      setPedido(data)
    } catch (error) {
      console.error(error)
      setError("Error al obtener el pedido. Inténtalo de nuevo más tarde.")
    } finally {
      setIsLoading(false)
    }
  }, [mesasParam])

  useEffect(() => {
    if (mesasParam) {
      const mesasArray = mesasParam.split(",").map(Number)
      const fetchMesas = async () => {
        const promises = mesasArray.map((mesaId) => fetch(`/api/mesas/${mesaId}`).then((res) => res.json()))
        const mesas = await Promise.all(promises)
        setSelectedTables(mesas)
      }
      fetchPedido()
      fetchMesas()
    } else {
      setIsLoading(false)
    }
  }, [fetchPedido, mesasParam])

  const calcularTotal = (detalles: any[]) => {
    return detalles.reduce((acc: number, detalle: any) => acc + detalle.Cantidad * detalle.PrecioUnitario, 0)
  }

  const addPlatoToPedido = async (platoId: number, cantidad: number) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/detallepedidos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          PedidoID: pedido.PedidoID,
          PlatoID: platoId,
          Cantidad: cantidad,
        }),
      })
      if (!response.ok) {
        throw new Error("Error al agregar el plato al pedido")
      }
      await fetchPedido()
    } catch (error) {
      console.error(error)
      setError("Error al agregar el plato al pedido. Inténtalo de nuevo más tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleIncrementarCantidad = async (detalleId: number) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/detallepedidos/${detalleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operacion: "incrementar",
        }),
      })
      if (!response.ok) {
        throw new Error("Error al incrementar la cantidad del plato")
      }
      const data = await response.json()
      setPedido((prevPedido: any) => {
        const detallesActualizados = prevPedido.detalles.map((detalle: any) =>
          detalle.DetalleID === detalleId
            ? {
                ...detalle,
                Cantidad: detalle.Cantidad + 1,
              }
            : detalle,
        )
        return {
          ...prevPedido,
          detalles: detallesActualizados,
          total: calcularTotal(detallesActualizados),
        }
      })
    } catch (error) {
      console.error(error)
      setError("Error al incrementar la cantidad del plato. Inténtalo de nuevo más tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDecrementarCantidad = async (detalleId: number) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/detallepedidos/${detalleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operacion: "decrementar",
        }),
      })
      if (!response.ok) {
        throw new Error("Error al decrementar la cantidad del plato")
      }
      setPedido((prevPedido: any) => {
        const detallesActualizados = prevPedido.detalles.map((detalle: any) =>
          detalle.DetalleID === detalleId ? { ...detalle, Cantidad: Math.max(detalle.Cantidad - 1, 1) } : detalle,
        )
        return {
          ...prevPedido,
          detalles: detallesActualizados,
          total: calcularTotal(detallesActualizados),
        }
      })
    } catch (error) {
      console.error(error)
      setError("Error al decrementar la cantidad del plato. Inténtalo de nuevo más tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEliminarPlato = async (detalleId: number) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/detallepedidos/${detalleId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Error al eliminar el plato del pedido")
      }
      setPedido((prevPedido: any) => {
        const detallesActualizados = prevPedido.detalles.filter((detalle: any) => detalle.DetalleID !== detalleId)
        return {
          ...prevPedido,
          detalles: detallesActualizados,
          total: calcularTotal(detallesActualizados),
        }
      })
    } catch (error) {
      console.error(error)
      setError("Error al eliminar el plato del pedido. Inténtalo de nuevo más tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoBack = () => {
    router.back()
  }

  const handleEliminarPedido = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/pedidos/${pedido.PedidoID}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Error al eliminar el pedido")
      }
      setPedido(null)
      router.back()
    } catch (error) {
      console.error(error)
      setError("Error al eliminar el pedido. Inténtalo de nuevo más tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePagarPedido = async () => {
    if (!pedido || !tipoPago) {
      alert("Selecciona un tipo de pago")
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch(`/api/pedidos/${pedido.PedidoID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...pedido,
          Estado: false,
          Fecha: new Date(),
          TipoPago: tipoPago,
        }),
      })
      if (!response.ok) {
        throw new Error("Error al pagar el pedido")
      }
      router.push("/empleado/sala")
    } catch (error) {
      console.error(error)
      setError("Error al pagar el pedido. Inténtalo de nuevo más tarde.")
    } finally {
      setIsLoading(false)
    }
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

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-4 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <Card className="overflow-hidden shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-brandSecondary to-brandSecondary/90 text-primary-foreground p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">Modificar pedido</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 md:hidden"
                onClick={handleGoBack}
              >
                ← Volver
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="flex flex-col xl:flex-row">
              {/* Sidebar - Información de mesa y controles */}
              <div className="w-full xl:w-1/3 p-4 sm:p-6 border-b xl:border-b-0 xl:border-r bg-gradient-to-b from-gray-50 to-white">
                <div className="space-y-4 sm:space-y-6">
                  {/* Información de la mesa */}
                  <Card className="shadow-md border-0 bg-white">
                    <CardContent className="p-4 sm:p-6">
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4 text-gray-800">
                        Mesa(s) {selectedTables.map((mesa) => mesa.NumeroMesa).join(", ")}
                      </h2>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full w-fit shadow-sm">
                          Ocupado
                        </span>
                        <div className="text-sm text-muted-foreground font-medium">Moz@: {empleado.Nombre}</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Controles */}
                  <div className="space-y-3 sm:space-y-4">
                    <MesaOcupadaAgregar
                      addPlatoToPedido={addPlatoToPedido}
                      pedido={pedido}
                      onPedidoUpdated={fetchPedido}
                    />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="w-full text-sm sm:text-base transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg"
                        >
                          <X className="w-4 h-4 mr-2" /> Cancelar Pedido
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Cancelar pedido?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará el pedido y todos sus platos asociados. ¿Estás seguro que deseas
                            continuar?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Volver</AlertDialogCancel>
                          <AlertDialogAction asChild>
                            <Button variant="destructive" onClick={handleEliminarPedido}>
                              Sí, cancelar pedido
                            </Button>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {pedido && (
                      <BoletaCocinaModal
                        mode="reimprimir"
                        pedidoId={pedido.PedidoID}
                        mesas={selectedTables}
                        orderItems={
                          pedido.detalles.map((detalle: any) => ({
                            PlatoID: detalle.PlatoID,
                            Descripcion: detalle.descripcionPlato,
                            Cantidad: detalle.Cantidad,
                          })) || []
                        }
                        triggerButton={
                          <Button
                            className="w-full text-sm sm:text-base transition-all duration-300 ease-in-out transform hover:scale-105 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg"
                            disabled={!pedido || pedido.detalles.length === 0}
                          >
                            <Printer className="w-4 h-4 mr-2" /> Reimprimir Comanda
                          </Button>
                        }
                      />
                    )}

                    <Button
                      variant="link"
                      className="w-full text-brandSecondary hover:text-brandSecondary/80 transition-colors text-sm sm:text-base hidden md:block"
                      onClick={handleGoBack}
                    >
                      ← Volver
                    </Button>
                  </div>
                </div>
              </div>

              {/* Contenido principal - Pedido */}
              <div className="w-full xl:w-2/3 p-4 sm:p-6 bg-white">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">Pedido:</h2>
                    {pedido && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                          {pedido.detalles.length} platos
                        </span>
                        <span className="font-semibold text-gray-800">Total: S/. {pedido.total.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brandSecondary mx-auto mb-4"></div>
                      <p className="text-gray-500">Cargando pedido...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-12">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <p className="text-red-600 text-sm sm:text-base">{error}</p>
                      </div>
                    </div>
                  ) : pedido ? (
                    <>
                      {/* Tabla para pantallas medianas y grandes */}
                      <div className="hidden md:block overflow-x-auto">
                        <Card className="shadow-sm">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50">
                                <TableHead className="whitespace-nowrap font-semibold">Plato</TableHead>
                                <TableHead className="whitespace-nowrap font-semibold">Cant.</TableHead>
                                <TableHead className="whitespace-nowrap font-semibold">Precio U.</TableHead>
                                <TableHead className="whitespace-nowrap font-semibold">Precio T.</TableHead>
                                <TableHead className="whitespace-nowrap font-semibold">Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pedido.detalles.map((detalle: any) => (
                                <TableRow key={detalle.PlatoID} className="hover:bg-gray-50 transition-colors">
                                  <TableCell className="font-medium">{detalle.descripcionPlato}</TableCell>
                                  <TableCell className="font-semibold">{detalle.Cantidad}</TableCell>
                                  <TableCell>S/. {Number(detalle.PrecioUnitario).toFixed(2)}</TableCell>
                                  <TableCell className="font-semibold">
                                    S/. {(detalle.Cantidad * detalle.PrecioUnitario).toFixed(2)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDecrementarCantidad(detalle.DetalleID)}
                                        className="p-2 hover:bg-gray-100 transition-colors"
                                      >
                                        <MinusIcon size={14} />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleIncrementarCantidad(detalle.DetalleID)}
                                        className="p-2 hover:bg-gray-100 transition-colors"
                                      >
                                        <PlusIcon size={14} />
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleEliminarPlato(detalle.DetalleID)}
                                        className="p-2 hover:bg-red-600 transition-colors"
                                      >
                                        <Trash2 size={14} />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Card>
                      </div>

                      <div className="md:hidden">
                        <Collapsible open={isPlatosOpen} onOpenChange={setIsPlatosOpen}>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between p-4 h-auto bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all duration-200"
                            >
                              <div className="flex items-center gap-3">
                                <div className="bg-brandSecondary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                                  {pedido.detalles.length}
                                </div>
                                <span className="font-semibold text-gray-700">
                                  {isPlatosOpen ? "Ocultar platos" : "Ver platos del pedido"}
                                </span>
                              </div>
                              {isPlatosOpen ? (
                                <ChevronUp className="h-5 w-5 text-gray-600" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-600" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-3 mt-3">
                            {pedido.detalles.map((detalle: any) => (
                              <Card key={detalle.PlatoID} className="shadow-sm border-l-4 border-l-brandSecondary">
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                      <h3 className="font-semibold text-sm leading-tight text-gray-800">
                                        {detalle.descripcionPlato}
                                      </h3>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleEliminarPlato(detalle.DetalleID)}
                                        className="p-1.5 ml-2 flex-shrink-0 hover:scale-105 transition-transform"
                                      >
                                        <Trash2 size={12} />
                                      </Button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div className="bg-gray-50 p-2 rounded-lg">
                                        <span className="text-gray-600 text-xs">Precio U.:</span>
                                        <div className="font-bold text-gray-800">
                                          S/. {Number(detalle.PrecioUnitario).toFixed(2)}
                                        </div>
                                      </div>
                                      <div className="bg-blue-50 p-2 rounded-lg">
                                        <span className="text-blue-600 text-xs">Total:</span>
                                        <div className="font-bold text-blue-800">
                                          S/. {(detalle.Cantidad * detalle.PrecioUnitario).toFixed(2)}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                      <span className="text-sm font-medium text-gray-700">Cantidad:</span>
                                      <div className="flex items-center gap-3">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDecrementarCantidad(detalle.DetalleID)}
                                          className="p-2 hover:bg-red-50 hover:border-red-200 transition-colors"
                                        >
                                          <MinusIcon size={14} />
                                        </Button>
                                        <span className="font-bold text-lg min-w-[2.5rem] text-center bg-white px-3 py-1 rounded border">
                                          {detalle.Cantidad}
                                        </span>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleIncrementarCantidad(detalle.DetalleID)}
                                          className="p-2 hover:bg-green-50 hover:border-green-200 transition-colors"
                                        >
                                          <PlusIcon size={14} />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      </div>

                      {/* Total y pago */}
                      <Card className="shadow-lg border-0 bg-gradient-to-r from-gray-50 to-white">
                        <CardContent className="p-4 sm:p-6">
                          <div className="space-y-4">
                            <div className="text-center sm:text-left">
                              <span className="text-2xl sm:text-3xl font-bold text-gray-800 bg-gradient-to-r from-brandSecondary to-brandSecondary/80 bg-clip-text text-transparent">
                                Total: S/. {pedido.total.toFixed(2)}
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-end">
                              <Select
                                onValueChange={(value) => setTipoPago(Number(value))}
                                value={tipoPago?.toString() || ""}
                              >
                                <SelectTrigger className="w-full sm:w-48 h-12 border-2 hover:border-brandSecondary transition-colors">
                                  <SelectValue placeholder="Seleccionar tipo de pago" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">Efectivo</SelectItem>
                                  <SelectItem value="2">Yape</SelectItem>
                                  <SelectItem value="3">POS</SelectItem>
                                </SelectContent>
                              </Select>

                              <Button
                                onClick={handlePagarPedido}
                                disabled={!tipoPago}
                                className={`w-full sm:w-auto h-12 px-8 ${buttonColor} transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold`}
                              >
                                <Check className="w-5 h-5 mr-2" />
                                Pagar Pedido
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8">
                        <p className="text-gray-500 text-sm sm:text-base">
                          No se encontró ningún pedido activo para estas mesas.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
