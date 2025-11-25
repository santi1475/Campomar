"use client"

import { useState, useEffect } from "react"

export interface Employee {
    id: string
    name: string
    dni: string
    avatar?: string | null
    totalSales: number
    tablesServed: number
    suspiciousDeletions: number
    trustLevel: "high" | "medium" | "low"
}

export function useEmployees() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchEmployees() {
            try {
                setLoading(true)
                const response = await fetch("/api/superAdmin/empleados")
                
                if (!response.ok) {
                    throw new Error("Error al cargar empleados")
                }
                
                const data = await response.json()
                setEmployees(data)
                setError(null)
            } catch (err) {
                console.error("Error fetching employees:", err)
                setError(err instanceof Error ? err.message : "Error desconocido")
            } finally {
                setLoading(false)
            }
        }

        fetchEmployees()
    }, [])

    return { employees, loading, error, refetch: () => {
        const fetchEmployees = async () => {
            try {
                setLoading(true)
                const response = await fetch("/api/superAdmin/empleados")
                if (!response.ok) throw new Error("Error al cargar empleados")
                const data = await response.json()
                setEmployees(data)
                setError(null)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido")
            } finally {
                setLoading(false)
            }
        }
        fetchEmployees()
    }}
}

