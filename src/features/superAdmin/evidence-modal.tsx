import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Receipt, AlertTriangle } from 'lucide-react'

interface SecurityAlert {
    id: string
    dateTime: string
    table: string
    waiter: string
    deletedItem: string
    quantity: number
    lostAmount: number
    actionType: "Eliminación Total" | "Disminución"
    orderId: string
}

interface EvidenceModalProps {
    alert: SecurityAlert | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EvidenceModal({ alert, open, onOpenChange }: EvidenceModalProps) {
    if (!alert) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                        Evidencia del Incidente
                    </DialogTitle>
                    <DialogDescription>
                        Detalles completos de la eliminación sospechosa
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Left Side - The Crime */}
                    <div className="space-y-4">
                        <div className="rounded-lg border-2 border-destructive/20 bg-destructive/5 p-4">
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                El Incidente
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">Pedido ID</p>
                                    <p className="font-mono font-semibold">{alert.orderId}</p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground">Fecha y Hora</p>
                                    <p className="font-semibold">{alert.dateTime}</p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground">Mesa</p>
                                    <p className="font-semibold">{alert.table}</p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground">Responsable</p>
                                    <p className="font-semibold">{alert.waiter}</p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground">Plato Eliminado</p>
                                    <p className="font-semibold text-lg">{alert.deletedItem}</p>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Cantidad</p>
                                        <p className="font-semibold text-xl">{alert.quantity}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Monto Perdido</p>
                                        <p className="font-semibold text-xl text-destructive">
                                            S/. {alert.lostAmount.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground">Tipo de Acción</p>
                                    <Badge
                                        variant={alert.actionType === "Eliminación Total" ? "destructive" : "secondary"}
                                        className="mt-1"
                                    >
                                        {alert.actionType}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - The Proof */}
                    <div className="space-y-4">
                        <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-primary" />
                                La Prueba - Comandas
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Historial de comandas generadas para este pedido
                            </p>

                            {/* Kitchen Ticket Replica */}
                            <div className="space-y-3">
                                <div className="rounded-lg border-2 border-primary bg-card p-4 font-mono text-sm shadow-lg">
                                    <div className="text-center border-b-2 border-dashed pb-2 mb-3">
                                        <p className="font-bold">COMANDA DE COCINA</p>
                                        <p className="text-xs text-muted-foreground">#{alert.orderId}</p>
                                    </div>

                                    <div className="space-y-1 mb-3">
                                        <p><span className="text-muted-foreground">Mesa:</span> {alert.table}</p>
                                        <p><span className="text-muted-foreground">Mozo:</span> {alert.waiter}</p>
                                        <p><span className="text-muted-foreground">Hora:</span> {alert.dateTime}</p>
                                    </div>

                                    <div className="border-t-2 border-dashed pt-2 mb-3">
                                        <p className="font-bold mb-2">ITEMS:</p>
                                        <div className="bg-warning/20 border-2 border-warning rounded p-2">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold">{alert.quantity}x {alert.deletedItem}</span>
                                                <Badge variant="outline" className="bg-warning text-warning-foreground">
                                                    ELIMINADO
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Este plato fue enviado a cocina
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-t-2 border-dashed pt-2 text-center">
                                        <p className="text-xs text-muted-foreground">
                                            Impreso: {alert.dateTime}
                                        </p>
                                        <p className="text-xs font-bold mt-1">
                                            ✓ COMANDA CONFIRMADA
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-lg bg-muted p-3 text-sm">
                                    <p className="font-semibold mb-1">📋 Análisis:</p>
                                    <p className="text-muted-foreground">
                                        Esta comanda demuestra que el plato <span className="font-semibold text-foreground">{alert.deletedItem}</span> fue
                                        enviado a cocina a las <span className="font-semibold text-foreground">{alert.dateTime}</span>,
                                        pero posteriormente fue eliminado del sistema sin registro de cancelación válida.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
