"use client"

import { useState, useEffect } from "react"

export interface SecurityAlert {
    id: string
    dateTime: string
    table: string
    waiter: string
    deletedItem: string
    quantity: number
    lostAmount: number
    orderId: string
}

export function useAlerts() {
    const [alerts, setAlerts] = useState<SecurityAlert[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchAlerts() {
            try {
                setLoading(true)
                const response = await fetch("/api/superAdmin/alerts")
                
                if (!response.ok) {
                    throw new Error("Error al cargar alertas")
                }
                
                const data = await response.json()
                setAlerts(data)
                setError(null)
            } catch (err) {
                console.error("Error fetching alerts:", err)
                setError(err instanceof Error ? err.message : "Error desconocido")
            } finally {
                setLoading(false)
            }
        }

        fetchAlerts()
    }, [])

    return { alerts, loading, error, refetch: () => {
        const fetchAlerts = async () => {
            try {
                setLoading(true)
                const response = await fetch("/api/superAdmin/alerts")
                if (!response.ok) throw new Error("Error al cargar alertas")
                const data = await response.json()
                setAlerts(data)
                setError(null)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido")
            } finally {
                setLoading(false)
            }
        }
        fetchAlerts()
    }}
}

