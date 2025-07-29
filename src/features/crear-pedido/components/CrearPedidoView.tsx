"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Search, ChevronDown, ChevronUp, ShoppingCart, Minus, Trash } from "lucide-react"
import type { empleados, mesas, platos } from "@prisma/client"
import { useEmpleadoStore } from "@/store/empleado"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import BoletaCocinaDialog from "@/features/impresion-cocina/components/BoletaCocinaDialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface MesaProps {
  mesas: mesas[]
}

interface PedidoItem extends platos {
  Cantidad: number
}

export default function MesaLibre({ mesas }: MesaProps) {
  const router = useRouter()
  const [orderItems, setOrderItems] = useState<PedidoItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [platos, setPlatos] = useState<PedidoItem[]>([])
  const [filteredPlatos, setFilteredPlatos] = useState<PedidoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const empleado: empleados = useEmpleadoStore((state: any) => state.empleado)
  const [filterCategory, setFilterCategory] = useState<string>("")
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false)

  useEffect(() => {
    const fetchPlatos = async () => {
      try {
        const response = await fetch("/api/platos", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
        if (!response.ok) {
          throw new Error("Error al obtener los platos")
        }
        const data = await response.json()
        setPlatos(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPlatos()
  }, [])

  useEffect(() => {
    const filtered = platos.filter((plato) => plato.Descripcion!.toLowerCase().includes(searchTerm.toLowerCase()))
    const categoryFiltered = filtered.filter((plato) => {
      if (filterCategory === "todos" || filterCategory === "") {
        return true
      }
      return plato.CategoriaID === Number.parseInt(filterCategory)
    })
    setFilteredPlatos(categoryFiltered)
  }, [searchTerm, filterCategory, platos])

  const addToOrder = (plato: PedidoItem) => {
    const existingItem = orderItems.find((orderItem) => orderItem.PlatoID === plato.PlatoID)
    if (existingItem) {
      setOrderItems(
        orderItems.map((orderItem: PedidoItem) =>
          orderItem.PlatoID === plato.PlatoID ? { ...orderItem, Cantidad: orderItem.Cantidad + 1 } : orderItem,
        ),
      )
    } else {
      setOrderItems([...orderItems, { ...plato, Cantidad: 1 }])
    }
  }

  const removeFromOrder = (plato: PedidoItem) => {
    const existingItem = orderItems.find((orderItem) => orderItem.PlatoID === plato.PlatoID)
    if (existingItem && existingItem.Cantidad > 1) {
      setOrderItems(
        orderItems.map((orderItem) =>
          orderItem.PlatoID === plato.PlatoID ? { ...orderItem, Cantidad: orderItem.Cantidad - 1 } : orderItem,
        ),
      )
    } else {
      setOrderItems(orderItems.filter((orderItem) => orderItem.PlatoID !== plato.PlatoID))
    }
  }

  const increaseQuantity = (plato: PedidoItem) => {
    setOrderItems(
      orderItems.map((orderItem) =>
        orderItem.PlatoID === plato.PlatoID ? { ...orderItem, Cantidad: orderItem.Cantidad + 1 } : orderItem,
      ),
    )
  }

  const decreaseQuantity = (plato: PedidoItem) => {
    const existingItem = orderItems.find((orderItem) => orderItem.PlatoID === plato.PlatoID)
    if (existingItem && existingItem.Cantidad > 1) {
      setOrderItems(
        orderItems.map((orderItem) =>
          orderItem.PlatoID === plato.PlatoID ? { ...orderItem, Cantidad: orderItem.Cantidad - 1 } : orderItem,
        ),
      )
    } else {
      setOrderItems(orderItems.filter((orderItem) => orderItem.PlatoID !== plato.PlatoID))
    }
  }

  const clearAllOrders = () => {
    setOrderItems([])
  }

  const total = orderItems.reduce((sum, item) => sum + (Number(item.Precio) ?? 0) * item.Cantidad, 0)

  if (isLoading) {
    return <div className="flex justify-center items-center h-[calc(100vh-8rem)]">Cargando...</div>
  }

  const handleRealizarPedido = async () => {
    try {
      const nuevoPedido = {
        EmpleadoID: empleado.EmpleadoID,
        Fecha: new Date(),
        Total: total,
      }
      const response = await fetch("/api/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nuevoPedido),
      })
      if (!response.ok) {
        throw new Error("Error al crear el pedido")
      }
      const pedido = await response.json()
      const PedidoID = pedido.PedidoID

      await Promise.all(
        orderItems.map((item) =>
          fetch("/api/detallepedidos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              PedidoID,
              PlatoID: item.PlatoID,
              Cantidad: item.Cantidad,
            }),
          }),
        ),
      )

      const mesasRelacionadas = mesas.map((mesa) => ({
        PedidoID,
        MesaID: mesa.MesaID,
      }))

      await Promise.all(
        mesasRelacionadas.map((mesa) =>
          fetch("/api/pedido_mesas", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(mesa),
          }),
        ),
      )

      const mesasActualizadas = mesas.map((mesa) => ({
        ...mesa,
        Estado: "Ocupada",
      }))

      await Promise.all(
        mesasActualizadas.map((mesa) =>
          fetch(`/api/mesas/${mesa.MesaID}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(mesa),
          }),
        ),
      )

      setOrderItems([])
      router.push("/empleado")
      alert("Pedido realizado correctamente")
    } catch (error) {
      console.error(error)
      alert("Ocurrió un error al realizar el pedido")
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Mobile Layout */}
      <div className="block lg:hidden h-full flex flex-col">
        {/* Header */}
        <div className="p-4 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            Nuevo Pedido - Mesa(s) {mesas.map((mesa) => mesa.NumeroMesa).join(", ")}
          </h1>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu</h2>
        </div>

        {/* Search and Filter */}
        <div className="px-4 mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar platos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white h-12 text-base"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="bg-white h-12 text-base">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="1">Criollo</SelectItem>
              <SelectItem value="2">Bebida</SelectItem>
              <SelectItem value="3">Porción</SelectItem>
              <SelectItem value="4">Caldo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 px-4 mb-4">
          <div className="border-2 border-blue-400 rounded-lg p-4 bg-white h-full">
            <div className="grid grid-cols-2 gap-3 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {filteredPlatos.map((item) => (
                <Card
                  key={item.PlatoID}
                  className="cursor-pointer hover:shadow-md transition-all bg-gray-100 hover:bg-gray-200 active:scale-95 h-24"
                  onClick={() => addToOrder(item)}
                >
                  <CardContent className="p-2 text-center h-full flex flex-col justify-center">
                    <h3 className="font-medium text-gray-900 mb-1 text-xs leading-tight line-clamp-2">
                      {item.Descripcion}
                    </h3>
                    <p className="text-sm font-semibold text-gray-900">S/. {Number(item.Precio!).toFixed(2)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Order Details - Collapsible */}
        <div className="bg-white border-t shadow-lg">
          <Collapsible open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
            <CollapsibleTrigger asChild>
              <div className="bg-slate-700 text-white px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-600 transition-colors">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="font-semibold text-base">Detalle de pedido</span>
                  {orderItems.length > 0 && (
                    <span className="bg-blue-500 text-white rounded-full px-2 py-1 text-sm font-medium min-w-[24px] text-center">
                      {orderItems.reduce((sum, item) => sum + item.Cantidad, 0)}
                    </span>
                  )}
                </div>
                {isOrderDetailsOpen ? <ChevronDown className="w-6 h-6" /> : <ChevronUp className="w-6 h-6" />}
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="p-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {orderItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay productos en el pedido</p>
                ) : (
                  <div className="space-y-3">
                    {orderItems.map((item) => (
                      <div key={item.PlatoID} className="bg-gray-50 p-3 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Left Column - Item Info */}
                          <div>
                            <h4 className="font-medium text-gray-900 text-base leading-tight mb-1">
                              {item.Descripcion}
                            </h4>
                            <p className="text-sm text-gray-600">S/. {Number(item.Precio!).toFixed(2)} c/u</p>
                          </div>

                          {/* Right Column - Controls and Price */}
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  decreaseQuantity(item)
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="font-semibold text-gray-900 min-w-[20px] text-center">
                                {item.Cantidad}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  increaseQuantity(item)
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOrderItems(orderItems.filter((orderItem) => orderItem.PlatoID !== item.PlatoID))
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </div>
                            <span className="font-semibold text-gray-900 text-base">
                              S/. {(Number(item.Precio ?? 0) * item.Cantidad).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {orderItems.length > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllOrders}
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                    >
                      Limpiar todo el pedido
                    </Button>
                  </div>
                )}
                {orderItems.length > 0 && (
                  <>
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-xl font-bold">S/. {total.toFixed(2)}</span>
                      </div>
                      <div className="w-full">
                        <BoletaCocinaDialog
                          mesas={mesas}
                          handleRealizarPedido={handleRealizarPedido}
                          orderItems={orderItems}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full mt-8 mb-8">
        {/* Left Side - Menu */}
        <div className="w-2/3 p-6 flex flex-col">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Nuevo Pedido - Mesa(s) {mesas.map((mesa) => mesa.NumeroMesa).join(", ")}
            </h1>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Menu</h2>

            {/* Search and Filter */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar platos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48 bg-white">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="1">Criollo</SelectItem>
                  <SelectItem value="2">Bebida</SelectItem>
                  <SelectItem value="3">Porción</SelectItem>
                  <SelectItem value="4">Caldo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Menu Grid */}
          <div className="flex-1">
            <div className="border-2 border-blue-400 rounded-lg p-6 bg-white h-full">
              <div className="grid grid-cols-3 gap-4 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {filteredPlatos.map((item) => (
                  <Card
                    key={item.PlatoID}
                    className="cursor-pointer hover:shadow-md transition-all bg-gray-100 hover:bg-gray-200 active:scale-95 h-28"
                    onClick={() => addToOrder(item)}
                  >
                    <CardContent className="p-3 text-center h-full flex flex-col justify-center">
                      <h3 className="font-medium text-gray-900 mb-2 text-sm leading-tight line-clamp-2">
                        {item.Descripcion}
                      </h3>
                      <p className="text-base font-semibold text-gray-900">S/. {Number(item.Precio!).toFixed(2)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Order Details */}
        <div className="w-1/3 p-6 border-l bg-gray-50">
          <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
            <div className="bg-slate-700 text-white px-4 py-3 rounded-t-lg">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5" />
                <span className="font-semibold">Detalle de pedido</span>
                {orderItems.length > 0 && (
                  <span className="bg-blue-500 text-white rounded-full px-2 py-1 text-sm font-medium min-w-[24px] text-center">
                    {orderItems.reduce((sum, item) => sum + item.Cantidad, 0)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {orderItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay productos en el pedido</p>
              ) : (
                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.PlatoID} className="bg-gray-50 p-3 rounded-lg">
                      <div className="grid grid-cols-2 gap-12">
                        {/* Left Column - Item Info */}
                        <div>
                          <h4 className="font-medium text-gray-900 leading-tight mb-1">{item.Descripcion}</h4>
                          <p className="text-sm text-gray-600">S/. {Number(item.Precio!).toFixed(2)} c/u</p>
                        </div>

                        {/* Right Column - Controls and Price */}
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => decreaseQuantity(item)}
                              className="h-7 w-7 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="font-semibold text-gray-900 min-w-[20px] text-center text-sm">
                              {item.Cantidad}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => increaseQuantity(item)}
                              className="h-7 w-7 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                setOrderItems(orderItems.filter((orderItem) => orderItem.PlatoID !== item.PlatoID))
                              }
                              className="h-7 w-7 p-0 ml-1"
                            >
                              <Trash className="w-3 h-3" />
                            </Button>
                          </div>
                          <span className="font-semibold text-gray-900 text-sm">
                            S/. {(Number(item.Precio ?? 0) * item.Cantidad).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {orderItems.length > 0 && (
              <div className="px-4 pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllOrders}
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                >
                  Limpiar todo el pedido
                </Button>
              </div>
            )}
            {orderItems.length > 0 && (
              <div className="border-t p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold">S/. {total.toFixed(2)}</span>
                </div>
                <BoletaCocinaDialog mesas={mesas} handleRealizarPedido={handleRealizarPedido} orderItems={orderItems} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
