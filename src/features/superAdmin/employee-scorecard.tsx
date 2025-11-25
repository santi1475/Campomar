"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, Loader2 } from "lucide-react"
import { useState } from "react"
import { EmployeeHistoryModal } from "./employee-history-modal"
import { useEmployees, type Employee } from "./hooks/use-employees"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function EmployeeScorecard() {
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const { employees, loading, error } = useEmployees()

    const handleViewHistory = (employee: Employee) => {
        setSelectedEmployee(employee)
        setIsHistoryOpen(true)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Cargando empleados...</span>
            </div>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    if (employees.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No hay empleados registrados
            </div>
        )
    }

    const getTrustBadge = (level: Employee["trustLevel"]) => {
        const config = {
            high: { label: "🟢 Alto", variant: "default" as const, className: "bg-success text-success-foreground" },
            medium: { label: "🟡 Medio", variant: "secondary" as const, className: "bg-warning text-warning-foreground" },
            low: { label: "🔴 Bajo", variant: "destructive" as const, className: "" },
        }
        const { label, variant, className } = config[level] 
        return (
            <Badge variant={variant} className={className}>
                {label}
            </Badge>
        )
    }

    return (
        <>
            <div className="rounded-lg border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-semibold">Empleado</TableHead>
                                <TableHead className="font-semibold">DNI</TableHead>
                                <TableHead className="font-semibold text-right">Ventas Totales</TableHead>
                                <TableHead className="font-semibold text-right">Mesas Atendidas</TableHead>
                                <TableHead className="font-semibold text-center">Eliminaciones</TableHead>
                                <TableHead className="font-semibold text-center">Nivel de Confianza</TableHead>
                                <TableHead className="font-semibold text-center">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.map((employee) => (
                                <TableRow key={employee.id} className="hover:bg-muted/30">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={employee.avatar || undefined} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                    {employee.name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{employee.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono">{employee.dni}</TableCell>
                                    <TableCell className="text-right font-semibold">
                                        S/. {employee.totalSales.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right">{employee.tablesServed}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={employee.suspiciousDeletions > 3 ? "destructive" : "secondary"}>
                                            {employee.suspiciousDeletions}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">{getTrustBadge(employee.trustLevel)}</TableCell>
                                    <TableCell className="text-center">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 bg-transparent"
                                            onClick={() => handleViewHistory(employee)}
                                        >
                                            <Eye className="h-4 w-4" />
                                            <span className="hidden sm:inline">Ver Historial</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <EmployeeHistoryModal
                employee={selectedEmployee ? {
                    id: selectedEmployee.id,
                    name: selectedEmployee.name,
                    dni: selectedEmployee.dni,
                    avatar: selectedEmployee.avatar || undefined,
                    trustLevel: selectedEmployee.trustLevel
                } : null}
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
            />
        </>
    )
}
