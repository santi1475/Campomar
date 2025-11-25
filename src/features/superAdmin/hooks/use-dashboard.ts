"use client"

import { useState, useEffect } from "react"

export interface DashboardKPIs {
    dineroPerdido: number
    intentosFraude: number
    ventasMes: number
    ticketPromedio: number
    platoEstrella: string
}

export interface ChartData {
    name: string
    sales?: number
    deletions?: number
}

export interface DashboardData {
    kpis: DashboardKPIs
    charts: {
        topSalesData: ChartData[]
        topDeletedData: ChartData[]
    }
}

export function useDashboard() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchDashboard() {
            try {
                setLoading(true)
                const response = await fetch("/api/superAdmin/dashboard")
                
                if (!response.ok) {
                    throw new Error("Error al cargar datos del dashboard")
                }
                
                const dashboardData = await response.json()
                setData(dashboardData)
                setError(null)
            } catch (err) {
                console.error("Error fetching dashboard:", err)
                setError(err instanceof Error ? err.message : "Error desconocido")
            } finally {
                setLoading(false)
            }
        }

        fetchDashboard()
    }, [])

    return { data, loading, error, refetch: () => {
        const fetchDashboard = async () => {
            try {
                setLoading(true)
                const response = await fetch("/api/superAdmin/dashboard")
                if (!response.ok) throw new Error("Error al cargar datos del dashboard")
                const dashboardData = await response.json()
                setData(dashboardData)
                setError(null)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido")
            } finally {
                setLoading(false)
            }
        }
        fetchDashboard()
    }}
}

