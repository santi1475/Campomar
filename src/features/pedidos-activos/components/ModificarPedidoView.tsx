"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEmpleadoStore } from "@/store/empleado"
import type { empleados, mesas } from "@prisma/client"
import { X, PlusIcon, MinusIcon, Trash2, Printer, Check } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { MesaOcupadaAgregar } from "./ModalAgregarPlato"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import BoletaCocinaImprimir from "@/features/impresion-cocina/components/BoletaCocinaPrint"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
  const [comentarioCocina, setComentarioCocina] = useState("")
  const [showComentarioInput, setShowComentarioInput] = useState(false)

  // Llamada a la API para obtener el pedido relacionado con esas mesas
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
          Estado: 0,
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
    <div className="bg-gray-50 p-2 sm:p-4 lg:p-8 mt-5 border-1 mb-5 rounded-lg flex justify-center items-center">
      <div className="mx-auto max-w-7xl">
        <Card className="overflow-hidden">
          <CardHeader className="bg-brandSecondary text-primary-foreground p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">Modificar pedido</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <div className="flex flex-col xl:flex-row">
              {/* Sidebar - Información de mesa y controles */}
              <div className="w-full xl:w-1/3 p-4 sm:p-6 border-b xl:border-b-0 xl:border-r bg-gray-50">
                <div className="space-y-4 sm:space-y-6">
                  {/* Información de la mesa */}
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4">
                        Mesa(s) {selectedTables.map((mesa) => mesa.NumeroMesa).join(", ")}
                      </h2>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <span className="bg-red-100 text-red-800 text-xs sm:text-sm font-medium px-2.5 py-0.5 rounded w-fit">
                          Ocupado
                        </span>
                        <div className="text-sm text-muted-foreground">Moz@: {empleado.Nombre}</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Controles */}
                  <div className="space-y-3 sm:space-y-4">
                    <MesaOcupadaAgregar addPlatoToPedido={addPlatoToPedido} pedido={pedido} />

                    <Button
                      variant="destructive"
                      className="w-full text-sm sm:text-base transition duration-200 ease-in-out transform hover:scale-105"
                      onClick={handleEliminarPedido}
                    >
                      <X className="w-4 h-4 mr-2" /> Cancelar Pedido
                    </Button>

                    {pedido && (
                      <BoletaCocinaImprimir
                        pedidoId={pedido.PedidoID}
                        mesas={selectedTables}
                        orderItems={
                          pedido.detalles.map((detalle: any) => ({
                            PlatoID: detalle.PlatoID,
                            Descripcion: detalle.descripcionPlato,
                            Cantidad: detalle.Cantidad,
                          })) || []
                        }
                        comentario={comentarioCocina}
                        triggerButton={
                          <Button
                            className="w-full text-sm sm:text-base transition duration-200 ease-in-out transform hover:scale-105 bg-blue-600"
                            disabled={!pedido || pedido.detalles.length === 0}
                          >
                            <Printer className="w-4 h-4 mr-2" /> Imprimir Boleta
                          </Button>
                        }
                      />
                    )}

                    {/* Comentario para cocina */}
                    {!showComentarioInput ? (
                      <Button
                        variant="secondary"
                        className="w-full text-sm sm:text-base"
                        onClick={() => setShowComentarioInput(true)}
                      >
                        Agregar instrucción para cocina
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          className="border rounded p-2 w-full text-sm resize-none"
                          rows={3}
                          placeholder="Escribe una instrucción para la cocina..."
                          value={comentarioCocina}
                          onChange={(e) => setComentarioCocina(e.target.value)}
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setComentarioCocina("")
                              setShowComentarioInput(false)
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setShowComentarioInput(false)}
                            disabled={comentarioCocina.trim() === ""}
                          >
                            Guardar
                          </Button>
                        </div>
                      </div>
                    )}

                    <Button
                      variant="link"
                      className="w-full text-brandSecondary hover:text-brandSecondary/80 transition-colors text-sm sm:text-base"
                      onClick={handleGoBack}
                    >
                      ← Volver
                    </Button>
                  </div>
                </div>
              </div>

              {/* Contenido principal - Pedido */}
              <div className="w-full xl:w-2/3 p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">Pedido:</h2>

                  {isLoading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Cargando pedido...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <p className="text-red-500 text-sm sm:text-base">{error}</p>
                    </div>
                  ) : pedido ? (
                    <>
                      {/* Tabla para pantallas medianas y grandes */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="whitespace-nowrap">Plato</TableHead>
                              <TableHead className="whitespace-nowrap">Cant.</TableHead>
                              <TableHead className="whitespace-nowrap">Precio U.</TableHead>
                              <TableHead className="whitespace-nowrap">Precio T.</TableHead>
                              <TableHead className="whitespace-nowrap">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pedido.detalles.map((detalle: any) => (
                              <TableRow key={detalle.PlatoID}>
                                <TableCell className="font-medium">{detalle.descripcionPlato}</TableCell>
                                <TableCell>{detalle.Cantidad}</TableCell>
                                <TableCell>S/. {Number(detalle.PrecioUnitario).toFixed(2)}</TableCell>
                                <TableCell>S/. {(detalle.Cantidad * detalle.PrecioUnitario).toFixed(2)}</TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDecrementarCantidad(detalle.DetalleID)}
                                      className="p-2 hover:bg-gray-100"
                                    >
                                      <MinusIcon size={14} />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleIncrementarCantidad(detalle.DetalleID)}
                                      className="p-2 hover:bg-gray-100"
                                    >
                                      <PlusIcon size={14} />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleEliminarPlato(detalle.DetalleID)}
                                      className="p-2 hover:bg-red-600"
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Cards para pantallas pequeñas */}
                      <div className="md:hidden space-y-3">
                        {pedido.detalles.map((detalle: any) => (
                          <Card key={detalle.PlatoID}>
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                  <h3 className="font-medium text-sm leading-tight">{detalle.descripcionPlato}</h3>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleEliminarPlato(detalle.DetalleID)}
                                    className="p-1.5 ml-2 flex-shrink-0"
                                  >
                                    <Trash2 size={12} />
                                  </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-gray-600">Precio U.:</span>
                                    <div className="font-medium">S/. {Number(detalle.PrecioUnitario).toFixed(2)}</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Total:</span>
                                    <div className="font-medium">
                                      S/. {(detalle.Cantidad * detalle.PrecioUnitario).toFixed(2)}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Cantidad:</span>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDecrementarCantidad(detalle.DetalleID)}
                                      className="p-1.5"
                                    >
                                      <MinusIcon size={12} />
                                    </Button>
                                    <span className="font-medium min-w-[2rem] text-center">{detalle.Cantidad}</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleIncrementarCantidad(detalle.DetalleID)}
                                      className="p-1.5"
                                    >
                                      <PlusIcon size={12} />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Total y pago */}
                      <Card>
                        <CardContent className="p-4 sm:p-6">
                          <div className="space-y-4">
                            <div className="text-center sm:text-left">
                              <span className="text-xl sm:text-2xl font-bold">
                                Total: S/. {pedido.total.toFixed(2)}
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-end">
                              <Select
                                onValueChange={(value) => setTipoPago(Number(value))}
                                value={tipoPago?.toString() || ""}
                              >
                                <SelectTrigger className="w-full sm:w-40">
                                  <SelectValue placeholder="Tipo de pago" />
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
                                className={`w-full sm:w-auto ${buttonColor} transition duration-200 ease-in-out transform hover:scale-105`}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Pagar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm sm:text-base">
                        No se encontró ningún pedido activo para estas mesas.
                      </p>
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
