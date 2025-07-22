"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { List, Grid3X3, Columns3 } from "lucide-react"
import type { platos } from "@prisma/client"
import { motion } from "framer-motion"

async function fetchPlatos(): Promise<platos[]> {
  const response = await fetch("/api/platos", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
  if (!response.ok) {
    throw new Error("Error al obtener los platos")
  }
  return response.json()
}

const categorias: { [key: number]: { nombre: string; color: string; bgColor: string } } = {
  1: {
    nombre: "Criollo",
    color: "text-orange-800 dark:text-orange-100",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
  },
  2: { nombre: "Bebida", color: "text-blue-800 dark:text-blue-100", bgColor: "bg-blue-50 dark:bg-blue-900/20" },
  3: { nombre: "Porción", color: "text-green-800 dark:text-green-100", bgColor: "bg-green-50 dark:bg-green-900/20" },
  4: { nombre: "Caldo", color: "text-red-800 dark:text-red-100", bgColor: "bg-red-50 dark:bg-red-900/20" },
  5: { nombre: "Otro", color: "text-gray-800 dark:text-gray-100", bgColor: "bg-gray-50 dark:bg-gray-900/20" },
}

type ViewType = "list" | "grid" | "kanban"

export function ListaPlatos() {
  const [platos, setPlatos] = useState<platos[]>([])
  const [filteredPlatos, setFilteredPlatos] = useState<platos[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("")
  const [viewType, setViewType] = useState<ViewType>("grid")

  useEffect(() => {
    fetchPlatos()
      .then((data) => {
        setPlatos(data)
        setFilteredPlatos(data)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setIsLoading(false)
      })
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

  if (isLoading) {
    return <LoadingSkeleton viewType={viewType} />
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <Card className="mb-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 shadow-lg">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-gray-100">Menú de Platos</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4 lg:items-center lg:justify-between">
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 flex-grow">
              <Input
                placeholder="Buscar plato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-grow bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              {viewType !== "kanban" && (
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full md:w-[180px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
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
              )}
            </div>

            {/* View Selector */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={viewType === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewType("list")}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                Lista
              </Button>
              <Button
                variant={viewType === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewType("grid")}
                className="flex items-center gap-2"
              >
                <Grid3X3 className="h-4 w-4" />
                Cuadrícula
              </Button>
              <Button
                variant={viewType === "kanban" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewType("kanban")}
                className="flex items-center gap-2"
              >
                <Columns3 className="h-4 w-4" />
                Kanban
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Render based on view type */}
      {viewType === "list" && <ListView platos={filteredPlatos} />}
      {viewType === "grid" && <GridView platos={filteredPlatos} />}
      {viewType === "kanban" && <KanbanView platos={filteredPlatos} searchTerm={searchTerm} />}
    </div>
  )
}

// Vista Lista
function ListView({ platos }: { platos: platos[] }) {
  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {platos.map((plato, index) => {
            const categoriaNombre = plato.CategoriaID ? categorias[plato.CategoriaID]?.nombre || "Otro" : "Otro"
            const categoriaInfo = plato.CategoriaID ? categorias[plato.CategoriaID] : categorias[5]

            return (
              <motion.div
                key={plato.PlatoID}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{plato.Descripcion}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{categoriaNombre}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      S/{Number(plato.Precio || 0).toFixed(2)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${categoriaInfo.color} ${categoriaInfo.bgColor}`}>
                      {categoriaNombre}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Vista Cuadrícula (Original)
function GridView({ platos }: { platos: platos[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {platos.map((plato, index) => {
        const categoriaNombre = plato.CategoriaID ? categorias[plato.CategoriaID]?.nombre || "Otro" : "Otro"
        const categoriaInfo = plato.CategoriaID ? categorias[plato.CategoriaID] : categorias[5]

        return (
          <motion.div
            key={plato.PlatoID}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="h-full bg-white dark:bg-gray-800 hover:shadow-md transition-shadow duration-300 overflow-hidden">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{plato.Descripcion}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{categoriaNombre}</p>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    S/{Number(plato.Precio || 0).toFixed(2)}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${categoriaInfo.color} ${categoriaInfo.bgColor}`}>
                    {categoriaNombre}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

// Vista Kanban
function KanbanView({ platos, searchTerm }: { platos: platos[]; searchTerm: string }) {
  // Agrupar platos por categoría
  const platosPorCategoria = platos.reduce(
    (acc, plato) => {
      const categoriaId = plato.CategoriaID || 5
      if (!acc[categoriaId]) {
        acc[categoriaId] = []
      }
      acc[categoriaId].push(plato)
      return acc
    },
    {} as { [key: number]: platos[] },
  )

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 min-h-[600px]">
      {Object.entries(categorias).map(([categoriaId, categoria]) => {
        const platosEnCategoria = platosPorCategoria[Number.parseInt(categoriaId)] || []

        return (
          <motion.div
            key={categoriaId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: Number.parseInt(categoriaId) * 0.1 }}
            className="flex-shrink-0 w-80 sm:w-72"
          >
            <Card className={`h-full ${categoria.bgColor} border-2 border-gray-200 dark:border-gray-700`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-lg font-semibold ${categoria.color} flex items-center justify-between`}>
                  {categoria.nombre}
                  <span className="text-sm font-normal bg-white dark:bg-gray-800 px-2 py-1 rounded-full">
                    {platosEnCategoria.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                {platosEnCategoria.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">No hay platos en esta categoría</p>
                    {searchTerm && <p className="text-xs mt-1">{`que coincidan con "${searchTerm}"`}</p>}
                  </div>
                ) : (
                  platosEnCategoria.map((plato, index) => (
                    <motion.div
                      key={plato.PlatoID}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <Card className="bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
                            {plato.Descripcion}
                          </h3>
                          <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                              S/{Number(plato.Precio || 0).toFixed(2)}
                            </span>
                            <div className={`text-xs px-2 py-1 rounded-full ${categoria.color} ${categoria.bgColor}`}>
                              {categoria.nombre}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

function LoadingSkeleton({ viewType }: { viewType: ViewType }) {
  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4 lg:items-center lg:justify-between">
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 flex-grow">
              <Skeleton className="h-10 flex-grow" />
              <Skeleton className="h-10 w-[180px]" />
            </div>
            <Skeleton className="h-10 w-[300px]" />
          </div>
        </CardContent>
      </Card>

      {viewType === "list" && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-grow">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {viewType === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="h-[150px]">
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {viewType === "kanban" && (
        <div className="flex gap-6 overflow-x-auto pb-4">
          {[...Array(5)].map((_, columnIndex) => (
            <div key={columnIndex} className="flex-shrink-0 w-80 sm:w-72">
              <Card className="h-full">
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...Array(3)].map((_, cardIndex) => (
                    <Card key={cardIndex} className="h-[100px]">
                      <CardContent className="p-4">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-3" />
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-5 w-12" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <Alert variant="destructive">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  )
}
