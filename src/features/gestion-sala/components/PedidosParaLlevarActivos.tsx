"use client"
import { useEffect, useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Package, Clock, CheckCircle } from "lucide-react"

interface Pedido {
    PedidoID: number
    Fecha: string
    Total: string
    empleados: { Nombre: string | null }
    detallepedidos: Array<{
        DetalleID: number
        Cantidad: number
        platos: { Descripcion: string | null }
        Impreso: boolean
    }>
}

export function PedidosParaLlevarActivos() {
    const [pedidos, setPedidos] = useState<Pedido[]>([])
    const [loading, setLoading] = useState(false) // spinner fuerte (solo primera carga o manual)
    const [bgRefreshing, setBgRefreshing] = useState(false) // refresco silencioso
    const [lastUpdate, setLastUpdate] = useState<string | null>(null)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const firstLoadRef = useRef(true)

    interface FetchOpts {
        showSpinner?: boolean
        background?: boolean
    }

    const fetchPedidos = useCallback(async (opts: FetchOpts = {}) => {
        const { showSpinner = false, background = false } = opts
        const inicio = performance.now()
        if (showSpinner) setLoading(true)
        else if (background) setBgRefreshing(true)
        const ts = Date.now()
        console.log(
            `[PedidosParaLlevarActivos] Fetch iniciando showSpinner=${showSpinner} background=${background} ts=${ts}`,
        )
        try {
            const res = await fetch(`/api/pedidos-activos-para-llevar?_=${ts}`, { cache: "no-store" })
            if (!res.ok) {
                console.error("[PedidosParaLlevarActivos] Respuesta no OK", res.status)
            } else {
                const json = await res.json()
                console.log(`[PedidosParaLlevarActivos] Datos recibidos count=${json.count} generatedAt=${json.generatedAt}`)
                setPedidos(json.pedidos || [])
                setLastUpdate(new Date().toLocaleTimeString("es-PE"))
            }
        } catch (e) {
            console.error("[PedidosParaLlevarActivos] Error fetch", e)
        } finally {
            if (showSpinner) setLoading(false)
            if (background) setBgRefreshing(false)
            const dur = (performance.now() - inicio).toFixed(1)
            console.log(`[PedidosParaLlevarActivos] Fetch completado en ${dur}ms`)
        }
    }, [])

    useEffect(() => {
        // Primera carga con spinner
        fetchPedidos({ showSpinner: true })
        intervalRef.current = setInterval(() => {
            // Refrescos silenciosos
            fetchPedidos({ background: true })
        }, 8000)
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [fetchPedidos])

    return (
        <div className="w-full mt-6">
            <Card className="shadow-md">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                        <Package className="w-5 h-5 text-foreground" />
                        Pedidos para Llevar Activos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-xs text-muted-foreground">
                            {lastUpdate ? `Última actualización: ${lastUpdate}` : "Cargando..."}
                            {bgRefreshing && (
                                <span className="inline-flex items-center gap-1 ml-2 text-[10px] text-muted-foreground">
                                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
                                    actualizando
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => fetchPedidos({ showSpinner: true })}
                            className="text-xs px-2 py-1 border rounded hover:bg-muted flex items-center gap-1"
                            disabled={loading}
                        >
                            {loading ? "Actualizando..." : "Refrescar"}
                        </button>
                    </div>
                    {loading && pedidos.length === 0 ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : pedidos.length === 0 ? (
                        <div className="flex flex-col items-center py-8 gap-2">
                            <CheckCircle className="w-8 h-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">No hay pedidos para llevar activos</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                            {pedidos.map((p) => {
                                const hora = new Date(p.Fecha).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
                                const urgente = (Date.now() - new Date(p.Fecha).getTime()) / 60000 > 30
                                return (
                                    <Card
                                        key={p.PedidoID}
                                        className={`border ${urgente ? "border-destructive" : "border-border"} relative hover:shadow-sm transition-shadow`}
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs font-medium">
                                                        #{p.PedidoID}
                                                    </Badge>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {hora}
                                                    </Badge>
                                                </div>
                                                {urgente && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-destructive" />
                                                        <span className="text-xs text-destructive font-medium">URGENTE</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-sm font-medium text-foreground">{p.empleados?.Nombre || "Sin asignar"}</div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="space-y-1">
                                                {p.detallepedidos.map((pl) => (
                                                    <div key={pl.DetalleID} className="flex items-center justify-between text-sm">
                                                        <span className="text-foreground">
                                                            {pl.Cantidad}x {pl.platos?.Descripcion}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">{pl.Impreso ? "✓" : "⏳"}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t border-border">
                                                <span className="text-xs text-muted-foreground">Total:</span>
                                                <span className="font-semibold text-foreground">
                                                    S/. {Number.parseFloat(p.Total).toFixed(2)}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
