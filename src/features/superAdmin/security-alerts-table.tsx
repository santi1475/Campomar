"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, Loader2 } from 'lucide-react'
import { EvidenceModal } from "./evidence-modal"
import { useAlerts, type SecurityAlert } from "./hooks/use-alerts"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SecurityAlertWithActionType extends SecurityAlert {
    actionType?: "Eliminación Total" | "Disminución"
}

export function SecurityAlertsTable() {
    const [selectedAlert, setSelectedAlert] = useState<SecurityAlertWithActionType | null>(null)
    const { alerts, loading, error } = useAlerts()

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Cargando alertas...</span>
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

    if (alerts.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No hay alertas de seguridad registradas
            </div>
        )
    }

    return (
        <>
            <div className="rounded-lg border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-semibold">Fecha/Hora</TableHead>
                                <TableHead className="font-semibold">Mesa</TableHead>
                                <TableHead className="font-semibold">Mozo</TableHead>
                                <TableHead className="font-semibold">Plato Eliminado</TableHead>
                                <TableHead className="font-semibold text-right">Cantidad</TableHead>
                                <TableHead className="font-semibold text-right">Monto Perdido</TableHead>
                                <TableHead className="font-semibold">Tipo de Acción</TableHead>
                                <TableHead className="font-semibold text-center">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {alerts.map((alert) => {
                                const actionType: "Eliminación Total" | "Disminución" = alert.quantity > 0 ? "Eliminación Total" : "Disminución"
                                return (
                                    <TableRow key={alert.id} className="hover:bg-muted/30">
                                        <TableCell className="font-medium">{alert.dateTime}</TableCell>
                                        <TableCell>{alert.table}</TableCell>
                                        <TableCell>{alert.waiter}</TableCell>
                                        <TableCell>{alert.deletedItem}</TableCell>
                                        <TableCell className="text-right">{alert.quantity}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            S/. {alert.lostAmount.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={actionType === "Eliminación Total" ? "destructive" : "secondary"}
                                                className="whitespace-nowrap"
                                            >
                                                {actionType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedAlert({ ...alert, actionType })}
                                                className="gap-2"
                                            >
                                                <Eye className="h-4 w-4" />
                                                <span className="hidden sm:inline">Ver Evidencia</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <EvidenceModal
                alert={selectedAlert ? {
                    id: selectedAlert.id,
                    dateTime: selectedAlert.dateTime,
                    table: selectedAlert.table,
                    waiter: selectedAlert.waiter,
                    deletedItem: selectedAlert.deletedItem,
                    quantity: selectedAlert.quantity,
                    lostAmount: selectedAlert.lostAmount,
                    actionType: selectedAlert.actionType || "Disminución",
                    orderId: selectedAlert.orderId
                } : null}
                open={!!selectedAlert}
                onOpenChange={(open) => !open && setSelectedAlert(null)}
            />
        </>
    )
}
