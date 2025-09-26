"use client"

import { useEffect, useState, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Edit, PlusCircle, Trash2, Users, Clock } from "lucide-react"
import type { mesas } from "@prisma/client"
import { Spinner } from "@/components/shared/ui/spinner"
import PedidosModal from "@/features/gestion-mesas/components/ModalVerPedido"
import { ModalConfirm } from "@/components/shared/ui/ModalConfirm"
import { PedidosParaLlevarActivos } from "@/features/gestion-sala/components/PedidosParaLlevarActivos";

interface PedidoActivo {
  PedidoID: number
  tipoPago: number
}

export const GestionMesas = () => {
  const [tables, setTables] = useState<mesas[]>([])
  const [activePedidos, setActivePedidos] = useState<Record<number, PedidoActivo>>({})
  const [newTable, setNewTable] = useState<mesas>({
    MesaID: 0,
    NumeroMesa: 0,
    Estado: "Libre",
    Activo: true,
  })
  const [editingTable, setEditingTable] = useState<mesas | null>(null)
  const [loadingTables, setLoadingTables] = useState<boolean>(false)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; mesaId: number | null }>({
    open: false,
    mesaId: null,
  })
  const [errorMsg, setErrorMsg] = useState<string>("")

  const fetchActivePedidosForTables = useCallback(async (mesas: mesas[]) => {
    try {
      const pedidosMap: Record<number, PedidoActivo> = {}

      const promises = mesas
        .filter((mesa) => mesa.Estado === "Ocupada")
        .map(async (mesa) => {
          try {
            const pedidoResponse = await fetch(`/api/pedido_mesas?mesas=${mesa.MesaID}`)
            if (pedidoResponse.ok) {
              const pedido = await pedidoResponse.json()
              if (pedido && pedido.PedidoID) {
                pedidosMap[mesa.MesaID] = {
                  PedidoID: pedido.PedidoID,
                  tipoPago: pedido.TipoPago || 1,
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching pedido for mesa ${mesa.MesaID}:`, error)
          }
        })

      await Promise.all(promises)
      setActivePedidos(pedidosMap)
    } catch (error) {
      console.error("Error fetching active pedidos:", error)
    }
  }, [])

  const fetchTables = useCallback(async () => {
    try {
      const response = await fetch("/api/mesas", { method: "GET" })

      if (!response.ok) throw new Error("Error al obtener las mesas")

      const mesas = await response.json()
      setTables(mesas)

      fetchActivePedidosForTables(mesas)
    } catch (error) {
      console.error(error)
    }
  }, [fetchActivePedidosForTables])

  useEffect(() => {
    fetchTables()

    const interval = setInterval(fetchTables, 5000)

    return () => clearInterval(interval)
  }, [fetchTables])

  const handleAddTable = async () => {
    if (newTable?.NumeroMesa && newTable.Estado) {
      setLoadingTables(true)
      try {
        const response = await fetch("/api/mesas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            NumeroMesa: newTable.NumeroMesa,
            Estado: newTable.Estado,
          }),
        })

        if (!response.ok) throw new Error("Error al agregar la mesa")

        const mesa = await response.json()
        setTables([...tables, mesa])
        setNewTable({ MesaID: 0, Estado: "Libre", NumeroMesa: 0, Activo: true })
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingTables(false)
      }
    }
  }

  const handleEditTable = async () => {
    if (!editingTable?.NumeroMesa || editingTable.NumeroMesa <= 0) {
      setErrorMsg("El número de mesa debe ser mayor que cero.")
      return
    }
    // Validar que no exista otra mesa con el mismo número
    const existe = tables.some(
      (mesa) => mesa.NumeroMesa === editingTable.NumeroMesa && mesa.MesaID !== editingTable.MesaID,
    )
    if (existe) {
      setErrorMsg("Ya existe una mesa con ese número.")
      return
    }
    setLoadingTables(true)
    setErrorMsg("")
    try {
      const response = await fetch(`/api/mesas/${editingTable.MesaID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          NumeroMesa: editingTable.NumeroMesa,
          Estado: editingTable.Estado,
        }),
      })

      if (!response.ok) throw new Error("Error al actualizar la mesa")

      const updatedMesa = await response.json()
      setTables((prevTables) => prevTables.map((mesa) => (mesa.MesaID === updatedMesa.MesaID ? updatedMesa : mesa)))
      setEditingTable(null)
      setErrorMsg("")
    } catch (error) {
      setErrorMsg("Error al actualizar la mesa")
      console.error(error)
    } finally {
      setLoadingTables(false)
    }
  }

  const handleDeleteTable = async (id: number) => {
    try {
      const response = await fetch(`/api/mesas/${id}`, { method: "DELETE" })

      if (!response.ok) throw new Error("Error al eliminar la mesa")

      setTables(tables.filter((table) => table.MesaID !== id))
    } catch (error) {
      console.error(error)
    }
  }

  const selectTableForEdit = (table: mesas) => {
    setEditingTable(table)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Restaurante</h1>
          <p className="text-muted-foreground mt-2">Administra las mesas del restaurante y visualiza pedidos activos</p>
        </div>
      </div>

      <Tabs defaultValue="tables" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tables">Panel de Mesas</TabsTrigger>
          <TabsTrigger value="orders">Pedidos para Llevar</TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-6 mt-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Administración de Mesas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="tableNumber" className="text-sm font-medium text-foreground">
                    {editingTable ? "Editar Mesa" : "Número de Mesa"}
                  </Label>
                  <Input
                    id="tableNumber"
                    value={editingTable ? editingTable.NumeroMesa : newTable.NumeroMesa}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      if (editingTable) {
                        setEditingTable({
                          ...editingTable,
                          NumeroMesa: value,
                        })
                      } else {
                        setNewTable({
                          ...newTable,
                          NumeroMesa: value,
                        })
                      }
                      setErrorMsg("")
                    }}
                    placeholder="Número de Mesa"
                    type="number"
                    min={1}
                    className="bg-background border-border focus:border-primary focus:ring-primary/20"
                  />
                  {errorMsg && <div className="text-destructive text-sm font-medium">{errorMsg}</div>}
                </div>
                <Button
                  onClick={editingTable ? handleEditTable : handleAddTable}
                  className="sm:mt-auto bg-primary hover:bg-primary/90 text-primary-foreground h-10"
                  disabled={loadingTables}
                >
                  {loadingTables ? <Spinner className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                  {editingTable ? "Guardar Cambios" : "Añadir Mesa"}
                </Button>
              </div>

              {/* Grid de mesas: menos columnas para que cada card sea más grande */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {tables.map((table) => (
                  <div key={table.MesaID} className="group relative">
                    <div
                      className={`
                      relative w-full aspect-square rounded-2xl border-2 transition-all duration-300 cursor-pointer
                      shadow-sm hover:shadow-xl
                      ${
                        table.Estado === "Libre"
                          ? "bg-table-available-bg border-table-available/30 hover:border-table-available/60"
                          : "bg-red-100 border-red-300 hover:border-red-500"
                      }
                      group-hover:scale-[1.06]
                    `}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span
                          className={`text-2xl font-bold ${
                            table.Estado === "Libre" ? "text-table-available" : "text-red-700"
                          } md:text-3xl lg:text-4xl drop-shadow-sm`}
                        >
                          {table.NumeroMesa}
                        </span>
                      </div>

                      <div
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center 
                        opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl"
                      >
                        <div className="flex gap-3">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => selectTableForEdit(table)}
                            className="bg-card hover:bg-accent border border-border/50 h-10 w-10 flex items-center justify-center rounded-xl"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setConfirmDelete({ open: true, mesaId: table.MesaID })}
                            className="bg-card hover:bg-destructive/10 border border-border/50 text-destructive hover:text-destructive h-10 w-10 flex items-center justify-center rounded-xl"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <PedidosModal mesas={[table.MesaID]} triggerText="Ver" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          table.Estado === "Libre"
                            ? "bg-table-available/20 text-table-available border border-table-available/30"
                            : "bg-red-100 text-red-700 border border-red-300"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            table.Estado === "Libre" ? "bg-table-available" : "bg-red-500"
                          }`}
                        />
                        {table.Estado}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6 mt-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Pedidos Para Llevar Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PedidosParaLlevarActivos />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ModalConfirm
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, mesaId: null })}
        onConfirm={() => {
          if (confirmDelete.mesaId !== null) handleDeleteTable(confirmDelete.mesaId)
          setConfirmDelete({ open: false, mesaId: null })
        }}
        message="¿Estás seguro de que deseas eliminar esta mesa?"
      />
    </div>
  )
}
