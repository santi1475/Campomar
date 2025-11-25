import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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

// Mock history data generator based on employee ID
const getMockHistory = (employeeId: string): HistoryEvent[] => {
    // Return different data for different employees to make it realistic
    if (employeeId === "1") {
        // Carlos (Low trust)
        return [
            {
                id: "1",
                date: "23/11/2023",
                time: "14:30",
                table: "M-4",
                action: "deletion",
                item: "Lomo Saltado",
                amount: 45.0,
                risk: "high",
            },
            {
                id: "2",
                date: "23/11/2023",
                time: "13:15",
                table: "M-2",
                action: "deletion",
                item: "Ceviche Clásico",
                amount: 38.0,
                risk: "high",
            },
            {
                id: "3",
                date: "22/11/2023",
                time: "20:10",
                table: "T-8",
                action: "correction",
                item: "Inca Kola 1L",
                amount: 12.0,
                risk: "medium",
            },
            {
                id: "4",
                date: "21/11/2023",
                time: "19:45",
                table: "M-5",
                action: "deletion",
                item: "Pisco Sour",
                amount: 24.0,
                risk: "high",
            },
        ]
    }
    if (employeeId === "2") {
        // María (Medium trust)
        return [
            {
                id: "1",
                date: "23/11/2023",
                time: "15:20",
                table: "T-3",
                action: "correction",
                item: "Limonada Frozen",
                amount: 15.0,
                risk: "medium",
            },
            {
                id: "2",
                date: "20/11/2023",
                time: "21:00",
                table: "M-10",
                action: "deletion",
                item: "Arroz con Mariscos",
                amount: 42.0,
                risk: "high",
            },
        ]
    }
    return [] // José (High trust) - clean history
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
    if (!employee) return null

    const history = getMockHistory(employee.id)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
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

                <div className="mt-4">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
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
                                {history.length > 0 ? (
                                    history.map((event) => (
                                        <TableRow key={event.id}>
                                            <TableCell>
                                                <div className="font-medium">{event.date}</div>
                                                <div className="text-xs text-muted-foreground">{event.time}</div>
                                            </TableCell>
                                            <TableCell>{event.table}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-normal">
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
                                            No se encontraron incidentes recientes para este empleado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
