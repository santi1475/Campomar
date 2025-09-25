"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { RefreshCw, PlusCircle, Clock, DollarSign, Hash } from "lucide-react"

interface PedidoLite {
    PedidoID: number
    Fecha: string
    Total: any
    Estado: boolean
}

export default function ListaPedidosParaLlevar() {
    const [pedidos, setPedidos] = useState<PedidoLite[]>([])
    const [loading, setLoading] = useState(false)

    const cargar = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/pedidos?Estado=true&ParaLlevar=true")
            if (res.ok) {
                const data = await res.json()
                setPedidos(data.sort((a: PedidoLite, b: PedidoLite) => b.PedidoID - a.PedidoID))
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        cargar()
    }, [])

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold">Pedidos Para Llevar Activos</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={cargar} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refrescar
                    </Button>
                    <Link href="/empleado/para-llevar">
                        <Button className="bg-brandSecondary hover:bg-brandSecondary/80">
                            <PlusCircle className="w-4 h-4 mr-1" /> Nuevo
                        </Button>
                    </Link>
                </div>
            </div>

            {!loading && pedidos.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Sin pedidos para llevar activos.
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-2 border-dashed border-brandSecondary/30 hover:border-brandSecondary/50 hover:shadow-md transition-all cursor-pointer bg-brandSecondary/5">
                    <Link href="/empleado/para-llevar" className="block h-full">
                        <CardContent className="py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-brandSecondary/10 flex items-center justify-center">
                                    <PlusCircle className="w-6 h-6 text-brandSecondary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-brandSecondary">Crear Nuevo Pedido</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Presiona para agregar un pedido</p>
                                </div>
                            </div>
                        </CardContent>
                    </Link>
                </Card>

                {pedidos.map((p) => {
                    const dt = new Date(p.Fecha)
                    const hora = dt.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                    return (
                        <Card key={p.PedidoID} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Hash className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium text-lg">{p.PedidoID}</span>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] bg-indigo-100 text-indigo-700 border-indigo-300">
                                        Activo
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <span>{hora}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-semibold text-lg">S/. {Number(p.Total).toFixed(2)}</span>
                                </div>
                                <div className="pt-2">
                                    <Link href={`/empleado/para-llevar?pedido=${p.PedidoID}`}>
                                        <Button
                                            variant="outline"
                                            className="w-full text-brandSecondary border-brandSecondary hover:bg-brandSecondary hover:text-white bg-transparent"
                                        >
                                            Abrir Pedido
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
