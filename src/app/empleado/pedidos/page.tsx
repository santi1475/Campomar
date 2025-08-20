'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RefreshCcw, Search } from 'lucide-react'
import OrderTable from "@/features/pedidos-activos/components/OrderTable"

const OrdersPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1)
  }

  return (
    <div className="flex-1 overflow-hidden bg-gray-50 p-4 mr-4 ml-4">
      <Card className="h-full flex flex-col shadow-sm">
        <CardHeader className="py-4 px-6 bg-gray-100">
          <CardTitle className="text-2xl font-semibold text-gray-800">Pedidos</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por mesa..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 w-full border-gray-200 focus:border-primary focus:ring-primary"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="ml-4"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
          <div className="flex-1 overflow-auto">
            <OrderTable 
              searchTerm={searchTerm} 
              refreshKey={refreshKey}
              onDataMutation={handleRefresh}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OrdersPage

