"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Search, Trash, X } from "lucide-react"
import type { platos } from "@prisma/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import BoletaCocinaModal from "@/features/impresion-cocina/components/BoletaCocinaModal"

interface Props {
  addPlatoToPedido: (platoId: number, cantidad: number) => Promise<void>
  onPedidoUpdated: () => Promise<void>
  pedido: {
    PedidoID: number
    detalles: Array<{
      PlatoID: number
      descripcionPlato: string
      Cantidad: number
      PrecioUnitario: number
      DetalleID: number
      Impreso?: boolean
    }>
    mesas: Array<{
      NumeroMesa: number
      MesaID: number
    }>
  } | null
}

interface PedidoItem extends platos {
  Cantidad: number
}

export const MesaOcupadaAgregar = ({ addPlatoToPedido, pedido, onPedidoUpdated }: Props) => {
  const [orderItems, setOrderItems] = useState<PedidoItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [platos, setPlatos] = useState<PedidoItem[]>([])
  const [filteredPlatos, setFilteredPlatos] = useState<PedidoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [comentario, setComentario] = useState("")

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
    // Filtrado por texto y categoría
    let filtered = platos.filter((plato) => plato.Descripcion!.toLowerCase().includes(searchTerm.toLowerCase()))
    filtered = filtered.filter((plato) => {
      if (filterCategory === "todos" || filterCategory === "") {
        return true
      }
      return plato.CategoriaID === Number.parseInt(filterCategory)
    })
    // Excluir platos ya agregados en el pedido actual
    if (pedido && pedido.detalles) {
      filtered = filtered.filter(
        (plato) => !pedido.detalles.some((orderItem: any) => orderItem.PlatoID === plato.PlatoID)
      )
    }
    setFilteredPlatos(filtered)
  }, [searchTerm, filterCategory, platos, pedido])

  const addToOrder = (plato: PedidoItem) => {
    const existingItem = orderItems.find((orderItem) => orderItem.PlatoID === plato.PlatoID)
    if (existingItem) {
      setOrderItems(
        orderItems.map((orderItem: PedidoItem) =>
          orderItem.PlatoID === plato.PlatoID ? { ...orderItem, Cantidad: orderItem.Cantidad + 1 } : orderItem,
        ),
      )
    } else {
      // Asegurar que la descripción esté correctamente establecida
      setOrderItems([...orderItems, { 
        ...plato, 
        Cantidad: 1,
        Descripcion: plato.Descripcion || "Plato sin descripción"
      }])
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  const totalItems = orderItems.reduce((acc, item) => acc + item.Cantidad, 0)
  const totalAmount = orderItems.reduce((acc, item) => acc + Number(item.Precio ?? 0) * item.Cantidad, 0).toFixed(2)

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full bg-transparent">
          <Plus className="w-4 h-4 mr-2" />
          Agregar plato
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="max-w-6xl w-[95vw] h-[85vh] p-0 gap-0 overflow-hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col h-full min-h-0 overflow-hidden">
          <DialogHeader className="flex-shrink-0 p-4 sm:p-6 border-b bg-white">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg sm:text-xl">Agregar plato</DialogTitle>
                <DialogDescription className="text-sm sm:text-base mt-1">
                  Añade platos a la mesa, recuerda que puedes modificar la cantidad de cada plato en la mesa.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 relative">
            {/* Menú */}
            <div className="flex-1 lg:w-2/3 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-shrink-0 p-4 sm:p-6 bg-gray-50 border-b">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Menú</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Buscar platos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white h-10 sm:h-9"
                    />
                  </div>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full sm:w-48 bg-white h-10 sm:h-9">
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

              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-4 sm:p-6 pb-20 lg:pb-8">
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                    {filteredPlatos.map((item) => (
                      <Card
                        key={item.PlatoID}
                        className="cursor-pointer hover:shadow-md transition-all bg-white hover:bg-gray-50 active:scale-95 h-20 sm:h-24 border border-gray-200 flex-shrink-0"
                        onClick={() => addToOrder(item)}
                      >
                        <CardContent className="p-2 sm:p-3 text-center h-full flex flex-col justify-center">
                          <h3 className="font-medium text-gray-900 mb-1 text-xs sm:text-sm leading-tight line-clamp-2">
                            {item.Descripcion}
                          </h3>
                          <p className="text-sm sm:text-base font-semibold text-blue-600">
                            S/. {Number(item.Precio!).toFixed(2)}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {orderItems.length > 0 && !showMobileCart && (
              <Button
                onClick={() => setShowMobileCart(true)}
                className="lg:hidden fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 p-0"
              >
                <div className="relative">
                  <Plus className="w-6 h-6 text-white" />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold flex items-center justify-center">
                    {totalItems}
                  </span>
                </div>
              </Button>
            )}

            {showMobileCart && (
              <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 flex items-end">
                <div className="bg-white w-full max-h-[80vh] rounded-t-xl flex flex-col">
                  <div className="bg-slate-700 text-white px-4 py-3 flex-shrink-0 rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">Resumen del pedido</span>
                        <span className="bg-blue-500 text-white rounded-full px-2 py-1 text-sm font-medium min-w-[24px] text-center">
                          {totalItems}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowMobileCart(false)}
                        className="text-white hover:bg-slate-600 p-1 h-8 w-8"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <div className="p-4">
                      <div className="space-y-3">
                        {orderItems.map((item) => (
                          <div key={item.PlatoID} className="bg-gray-50 p-3 rounded-lg border">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 leading-tight mb-1 text-sm">
                                  {item.Descripcion}
                                </h4>
                                <p className="text-xs text-gray-600">S/. {Number(item.Precio!).toFixed(2)} c/u</p>
                              </div>
                              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900 text-sm min-w-[20px] text-center">
                                    {item.Cantidad}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => removeFromOrder(item)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Trash className="w-3 h-3" />
                                  </Button>
                                </div>
                                <span className="font-semibold text-blue-600 text-sm">
                                  S/. {(Number(item.Precio ?? 0) * item.Cantidad).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 border-t bg-white">
                    <div className="p-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOrderItems([])}
                        className="w-full text-red-600 border-red-200 hover:bg-red-50 bg-transparent mb-4"
                      >
                        Limpiar todo el pedido
                      </Button>

                      <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-xl font-bold text-blue-600">S/. {totalAmount}</span>
                      </div>

                      {/* Sección de comentario */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Comentario para cocina (opcional)
                        </label>
                        <Textarea
                          value={comentario}
                          onChange={(e) => setComentario(e.target.value)}
                          placeholder="Agregar instrucciones especiales..."
                          className="w-full"
                          rows={2}
                        />
                      </div>

                      {orderItems.length > 0 && pedido && (
                        <Button
                          disabled={isLoading || orderItems.length === 0 || isSubmitting}
                          className="w-full h-12 text-base font-semibold"
                          onClick={async () => {
                            if (!pedido) return;
                            try {
                              setIsSubmitting(true);
                              // Guardar los platos nuevos en la base de datos
                              for (const item of orderItems) {
                                await addPlatoToPedido(item.PlatoID, item.Cantidad);
                              }
                              // Crear la comanda para impresión SOLO de los platos nuevos
                              const detallesParaComanda = orderItems.map(item => ({
                                PlatoID: item.PlatoID,
                                Cantidad: item.Cantidad,
                                Descripcion: item.Descripcion || "Plato sin descripción"
                              }));

                              console.log("🖨️ Creando comanda para nuevos platos (mobile):", detallesParaComanda);
                              console.log("📝 Comentario para nuevos platos (mobile):", comentario);

                              const comandaResponse = await fetch("/api/comanda-cocina", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  pedidoID: pedido.PedidoID,
                                  comentario: comentario,
                                  detalles: detallesParaComanda
                                }),
                              });
                              if (comandaResponse.ok) {
                                const comandaData = await comandaResponse.json();
                                console.log("✅ Comanda creada exitosamente (mobile):", {
                                  ComandaID: comandaData.ComandaID,
                                  Comentario: comandaData.Comentario
                                });
                                
                                await onPedidoUpdated();
                                setOrderItems([]);
                                setComentario("");
                                setShowMobileCart(false);
                                setDialogOpen(false);
                                
                                // Mostrar mensaje de éxito
                                alert(`¡Platos agregados! Comanda #${comandaData.ComandaID} enviada a cocina para imprimir solo los nuevos platos.`);
                              } else {
                                const errorData = await comandaResponse.json();
                                console.error("❌ Error al crear comanda (mobile):", errorData);
                                alert(`Error al crear la comanda: ${errorData.message}`);
                              }
                            } catch (error) {
                              console.error("Error:", error);
                              alert("Error al procesar el pedido");
                            } finally {
                              setIsSubmitting(false);
                            }
                          }}
                        >
                          {isSubmitting ? "Procesando..." : "Agregar platos y generar comanda"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Resumen - Solo visible en desktop */}
            <div className="hidden lg:flex lg:w-1/3 flex-col bg-white border-l min-h-0 overflow-hidden">
              <div className="bg-slate-700 text-white px-4 py-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">Resumen del pedido</span>
                  {orderItems.length > 0 && (
                    <span className="bg-blue-500 text-white rounded-full px-2 py-1 text-sm font-medium min-w-[24px] text-center">
                      {orderItems.reduce((sum, item) => sum + item.Cantidad, 0)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-4">
                  {orderItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No hay productos en el pedido</p>
                  ) : (
                    <div className="space-y-3">
                      {orderItems.map((item) => (
                        <div key={item.PlatoID} className="bg-gray-50 p-3 rounded-lg border">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 leading-tight mb-1 text-sm">
                                {item.Descripcion}
                              </h4>
                              <p className="text-xs text-gray-600">S/. {Number(item.Precio!).toFixed(2)} c/u</p>
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 text-sm min-w-[20px] text-center">
                                  {item.Cantidad}
                                </span>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeFromOrder(item)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash className="w-3 h-3" />
                                </Button>
                              </div>
                              <span className="font-semibold text-blue-600 text-sm">
                                S/. {(Number(item.Precio ?? 0) * item.Cantidad).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {orderItems.length > 0 && (
                <div className="flex-shrink-0 border-t bg-white">
                  <div className="p-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOrderItems([])}
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 bg-transparent mb-4"
                    >
                      Limpiar todo el pedido
                    </Button>

                    <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-xl font-bold text-blue-600">S/. {totalAmount}</span>
                    </div>

                    {/* Sección de comentario */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comentario para cocina (opcional)
                      </label>
                      <Textarea
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        placeholder="Agregar instrucciones especiales..."
                        className="w-full"
                        rows={2}
                      />
                    </div>

                    {pedido && (
                      <Button
                        disabled={isLoading || orderItems.length === 0 || isSubmitting}
                        className="w-full h-12 text-base font-semibold"
                        onClick={async () => {
                          if (!pedido) return;
                          try {
                            setIsSubmitting(true);
                            // Guardar los platos nuevos en la base de datos
                            for (const item of orderItems) {
                              await addPlatoToPedido(item.PlatoID, item.Cantidad);
                            }
                            // Crear la comanda para impresión SOLO de los platos nuevos
                            const detallesParaComanda = orderItems.map(item => ({
                              PlatoID: item.PlatoID,
                              Cantidad: item.Cantidad,
                              Descripcion: item.Descripcion || "Plato sin descripción"
                            }));

                            console.log("🖨️ Creando comanda para nuevos platos:", detallesParaComanda);
                            console.log("📝 Comentario para nuevos platos:", comentario);

                            const comandaResponse = await fetch("/api/comanda-cocina", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                pedidoID: pedido.PedidoID,
                                comentario: comentario,
                                detalles: detallesParaComanda
                              }),
                            });
                            if (comandaResponse.ok) {
                              const comandaData = await comandaResponse.json();
                              console.log("✅ Comanda creada exitosamente:", {
                                ComandaID: comandaData.ComandaID,
                                Comentario: comandaData.Comentario
                              });
                              
                              await onPedidoUpdated();
                              setOrderItems([]);
                              setComentario("");
                              setDialogOpen(false);
                              
                              // Mostrar mensaje de éxito
                              alert(`¡Platos agregados! Comanda #${comandaData.ComandaID} enviada a cocina para imprimir solo los nuevos platos.`);
                            } else {
                              const errorData = await comandaResponse.json();
                              console.error("❌ Error al crear comanda:", errorData);
                              alert(`Error al crear la comanda: ${errorData.message}`);
                            }
                          } catch (error) {
                            console.error("Error:", error);
                            alert("Error al procesar el pedido");
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                      >
                        {isSubmitting ? "Procesando..." : "Agregar platos y generar comanda"}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>


    </Dialog>
  )
}
