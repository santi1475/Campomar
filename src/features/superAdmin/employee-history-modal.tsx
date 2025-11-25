"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"

interface HistoryEvent {
    id: string
    date: string
    time: string
    table: string
    action: "deletion" | "correction"
    item: string
    amount: number
    risk: "high" | "medium" | "low"
}

interface EmployeeHistoryModalProps {
    employee: {
        id: string
        name: string
        dni: string
        avatar?: string
        trustLevel: "high" | "medium" | "low"
    } | null
    isOpen: boolean
    onClose: () => void
}

export function EmployeeHistoryModal({ employee, isOpen, onClose }: EmployeeHistoryModalProps) {
    const [history, setHistory] = useState<HistoryEvent[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen && employee?.id) {
            fetchHistory(employee.id)
        } else {
            setHistory([])
        }
    }, [isOpen, employee])

    const fetchHistory = async (id: string) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/superAdmin/empleados/${id}/historial`)
            if (res.ok) {
                const data = await res.json()
                setHistory(data)
            } else {
                console.error("Error al cargar historial")
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (!employee) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-center gap-4 mb-2">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={employee.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                                {employee.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-xl">{employee.name}</DialogTitle>
                            <DialogDescription>DNI: {employee.dni} • Historial de Auditoría</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="mt-4 flex-1 overflow-auto border rounded-md">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow className="bg-muted/50">
                                <TableHead>Fecha / Hora</TableHead>
                                <TableHead>Mesa</TableHead>
                                <TableHead>Acción</TableHead>
                                <TableHead>Ítem</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                                <TableHead className="text-center">Riesgo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Cargando historial...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : history.length > 0 ? (
                                history.map((event) => (
                                    <TableRow key={event.id}>
                                        <TableCell>
                                            <div className="font-medium">{event.date}</div>
                                            <div className="text-xs text-muted-foreground">{event.time}</div>
                                        </TableCell>
                                        <TableCell>{event.table}</TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={event.action === "deletion" ? "destructive" : "secondary"} 
                                                className="font-normal"
                                            >
                                                {event.action === "deletion" ? "Eliminación" : "Corrección"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{event.item}</TableCell>
                                        <TableCell className="text-right">S/. {event.amount.toFixed(2)}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={event.risk === "high" ? "destructive" : "secondary"}
                                                className={
                                                    event.risk === "medium" ? "bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25" : ""
                                                }
                                            >
                                                {event.risk === "high" ? "Alto" : event.risk === "medium" ? "Medio" : "Bajo"}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No se encontraron incidentes sospechosos para este empleado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    )
}