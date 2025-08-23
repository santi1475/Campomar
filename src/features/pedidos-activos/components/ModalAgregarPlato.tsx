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
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Trash } from "lucide-react"
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

    if (!pedido) return
    console.log(pedido.detalles)

    const uniqueFilteredPlatos = categoryFiltered.filter(
      (plato) => !pedido.detalles.some((orderItem: any) => orderItem.PlatoID === plato.PlatoID),
    )

    setFilteredPlatos(uniqueFilteredPlatos)
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

  if (isLoading) {
    return <div>Cargando...</div>
  }


  const totalItems = orderItems.reduce((acc, item) => acc + item.Cantidad, 0)
  const totalAmount = orderItems.reduce((acc, item) => acc + Number(item.Precio ?? 0) * item.Cantidad, 0).toFixed(2)

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Agregar plato
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] h-[90vh] max-h-[90vh] overflow-hidden p-4">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl">Agregar plato</DialogTitle>
          <DialogDescription>
            Añade platos a la mesa, recuerda que puedes modificar la cantidad de cada plato en la mesa.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100%-8rem)] overflow-hidden">
          {/* Menú Section */}
          <div className="flex flex-col min-h-[250px]">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="px-4 py-2">
                <CardTitle>Menú</CardTitle>
              </CardHeader>
              <div className="px-4 py-2 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <Input
                    type="text"
                    placeholder="Buscar platos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Categoría" />
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
              <CardContent className="flex-1 overflow-auto p-0 px-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50%]">Plato</TableHead>
                        <TableHead className="w-[20%]">Precio</TableHead>
                        <TableHead className="w-[30%]">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlatos.map((item) => (
                        <TableRow key={item.PlatoID}>
                          <TableCell className="py-2 truncate max-w-[150px] sm:max-w-none">
                            {item.Descripcion}
                          </TableCell>
                          <TableCell className="py-2">S/. {Number(item.Precio!).toFixed(2)}</TableCell>
                          <TableCell className="py-2">
                            <Button size="sm" onClick={() => addToOrder(item)}>
                              <Plus className="w-4 h-4 mr-2" /> Agregar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumen del Pedido Section */}
          <div className="flex flex-col min-h-[250px]">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="px-4 py-2">
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-0 px-4 flex flex-col">
                {orderItems.length > 0 ? (
                  <div className="overflow-x-auto flex-1">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[30%]">Plato</TableHead>
                          <TableHead className="w-[15%]">Cant.</TableHead>
                          <TableHead className="w-[15%]">Precio</TableHead>
                          <TableHead className="w-[15%]">Total</TableHead>
                          <TableHead className="w-[25%]">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item) => (
                          <TableRow key={item.PlatoID}>
                            <TableCell className="py-2 truncate max-w-[120px] sm:max-w-none">
                              {item.Descripcion}
                            </TableCell>
                            <TableCell className="py-2">{item.Cantidad}</TableCell>
                            <TableCell className="py-2">S/. {Number(item.Precio!).toFixed(2)}</TableCell>
                            <TableCell className="py-2">
                              S/. {(Number(item.Precio ?? 0) * item.Cantidad).toFixed(2)}
                            </TableCell>
                            <TableCell className="py-2">
                              <Button size="sm" variant="destructive" onClick={() => removeFromOrder(item)}>
                                <Trash className="w-4 h-4 mr-2" /> Eliminar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-500">No hay platos agregados</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Resumen y botón de acción - Siempre visible en la parte inferior */}
        <div className="flex justify-between items-center border-t border-gray-200 pt-4 mt-0">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Total de items:</span>
              <span className="font-bold text-lg">{totalItems}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Total a pagar:</span>
              <span className="font-bold text-lg">S/. {totalAmount}</span>
            </div>
          </div>
          {pedido && (
            <BoletaCocinaModal
              mode="reimprimir"
              pedidoId={pedido.PedidoID}
              mesas={pedido.mesas || []}
              orderItems={orderItems.map(item => ({
                PlatoID: item.PlatoID,
                Descripcion: item.Descripcion || '',
                Cantidad: item.Cantidad
              }))}
              handleRealizarPedido={async () => {
                if (!pedido) return null;
                
                try {
                  setIsSubmitting(true);
                  
                  await Promise.all(orderItems.map((item) => 
                    addPlatoToPedido(item.PlatoID, item.Cantidad)
                  ));
                  await onPedidoUpdated();
                  setOrderItems([]);
                  
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  setDialogOpen(false);
                  
                  return pedido.PedidoID;
                } catch (error) {
                  console.error("Error al agregar los platos:", error);
                  alert("Error al agregar los platos: " + (error instanceof Error ? error.message : "Error desconocido"));
                  return null;
                } finally {
                  setIsSubmitting(false);
                }
              }}
              triggerButton={
                <Button disabled={isLoading || orderItems.length === 0}>
                  Agregar platos y generar comanda
                </Button>
              }
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

