"use client"

  import { Badge } from "@/components/ui/badge"
  import { Button } from "@/components/ui/button"
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
  import { Spinner } from "@/components/shared/ui/spinner"
  import type { mesas } from "@prisma/client"
  import { useRouter } from "next/navigation"
  import { useEffect, useState } from "react"
  import { Link } from "lucide-react"
  // import { PedidosParaLlevarActivos } from "./PedidosParaLlevarActivos"
  // FIX: Update the import path if the file exists elsewhere, for example:
  import { PedidosParaLlevarActivos } from "@/features/gestion-sala/components/PedidosParaLlevarActivos"

  export const Mesas = () => {
    const router = useRouter()
    const [mesas, setMesas] = useState<mesas[]>([])
    const [selectedTables, setSelectedTables] = useState<mesas[]>([])
    const [linkedTables, setLinkedTables] = useState<number[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
      const fetchMesas = async () => {
        try {
          const response = await fetch("/api/mesas", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          })
          if (!response.ok) {
            throw new Error("Error al obtener las mesas")
          }
          const data = await response.json()
          setMesas(data)
          setLinkedTables([]) // Limpiar el resaltado al cargar la vista
        } catch (error) {
          console.error(error)
        }
      }

      fetchMesas()
    }, [])

    const handleSelectTable = (table: mesas) => {
      setSelectedTables((prev: any) =>
        prev.includes(table) ? prev.filter((t: mesas) => t.MesaID !== table.MesaID) : [...prev, table],
      )
    }

    const handleGoToTable = () => {
      setIsLoading(true)
      if (selectedTables.length === 0) {
        setIsLoading(false)
        return
      }

      if (selectedTables.some((table) => table.Estado === "Ocupada")) {
        alert("Al menos una mesa seleccionada está ocupada")
        setIsLoading(false)
        return
      }

      const selectedTablesQuery = selectedTables.map((table) => table.MesaID).join(",")
      router.push(`/empleado/sala/mesa?mesas=${selectedTablesQuery}`)
    }

    const handleOccupiedTable = async (mesa: mesas) => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/mesas/relacion?mesaId=${mesa.MesaID}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
        if (!response.ok) {
          alert("Error al obtener la mesa")
          setIsLoading(false)
          return
        }

        const data = await response.json()
        const mesasRelacionadas = data.map((mesa: mesas) => mesa.MesaID)

        // Guardar las mesas enlazadas para resaltarlas
        setLinkedTables(mesasRelacionadas)

        router.push(`/empleado/sala/mesa?mesas=${mesasRelacionadas.join(",")}`)
      } catch (error) {
        console.error(error)
      }
    }

    return (
      <div className="w-full p-2 sm:p-4 md:p-6 lg:p-8">
        <Card className="w-full max-w-7xl mx-auto shadow-md">
          <CardHeader className="bg-white border-b p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 text-center sm:text-left">
              Sala del Restaurante
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            {/* Grid de mesas con mejor responsividad */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-4 mb-6">
              {mesas.map((mesa) => (
                <Button
                  key={mesa.MesaID}
                  onClick={mesa.Estado == "Libre" ? () => handleSelectTable(mesa) : () => handleOccupiedTable(mesa)}
                  variant={selectedTables.includes(mesa) ? "default" : "outline"}
                  className={`
                    h-12 sm:h-14 md:h-16 w-full text-xs sm:text-sm md:text-base font-medium rounded transition-colors duration-200
                    ${
                      selectedTables.includes(mesa)
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-white text-gray-800 hover:bg-gray-100"
                    }
                    ${mesa.Estado === "Ocupada" ? "bg-red-500 text-white hover:bg-red-600" : ""}
                    ${linkedTables.includes(mesa.MesaID) ? "border-4 border-blue-500" : ""}
                  `}
                >
                  {isLoading ? (
                    <Spinner size="small" className="text-current" />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <span className="truncate px-1">Mesa {mesa.NumeroMesa}</span>
                      {linkedTables.includes(mesa.MesaID) && linkedTables.length > 1 && (
                        <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-1 shadow-md">
                          <Link size={16} />
                        </div>
                      )}
                    </div>
                  )}
                </Button>
              ))}
            </div>

            {/* Sección inferior con mejor responsividad */}
            <div className="flex flex-col space-y-4">
              {/* Mesas seleccionadas */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                <div className="flex flex-col space-y-2">
                  <span className="font-medium text-sm sm:text-base text-gray-700">- Mesas seleccionadas:</span>
                  <div className="flex flex-wrap gap-1 sm:gap-2 max-w-full">
                    {selectedTables.length === 0 ? (
                      <span className="text-xs sm:text-sm text-gray-500 italic">Ninguna mesa seleccionada</span>
                    ) : (
                      selectedTables.map((table) => (
                        <Badge
                          key={table.MesaID}
                          variant="outline"
                          className="text-xs sm:text-sm py-1 px-2 bg-gray-100 whitespace-nowrap"
                        >
                          {table.NumeroMesa}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                {/* Botón de acción */}
                <div className="flex justify-center sm:justify-end w-full sm:w-auto">
                  <Button
                    onClick={handleGoToTable}
                    disabled={selectedTables.length === 0 || isLoading}
                    className="w-full sm:w-auto min-w-[140px] bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 sm:px-6 rounded transition-colors duration-200 flex items-center justify-center text-sm sm:text-base"
                  >
                    {isLoading ? (
                      <>
                        <Spinner size="small" className="mr-2 text-white" />
                        <span className="hidden sm:inline">Cargando...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Ir a la Carta</span>
                        <span className="sm:hidden">Carta</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Pedidos para llevar activos */}
              {/* <PedidosParaLlevarActivos /> */}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
