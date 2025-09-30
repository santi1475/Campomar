"use client"

import { useEffect, useState } from "react"
import { ordenarPlatosPorCategoria } from "@/lib/utils"
import { useRouter, useSearchParams } from "next/navigation"
import { useEmpleadoStore } from "@/store/empleado"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShoppingCart, Minus, Plus, Trash } from "lucide-react"
import BoletaCocinaModal from "@/features/impresion-cocina/components/BoletaCocinaModal"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import ModificarPedidoParaLlevar from "@/features/para-llevar/components/ModificarPedidoParaLlevar"

interface Plato {
    PlatoID: number;
    Descripcion: string;
    Precio: any;
    PrecioLlevar?: any;
    CategoriaID: number;
}

interface DetalleView {
    DetalleID?: number
    PlatoID: number
    descripcionPlato: string
    Cantidad: number
    PrecioUnitario: number
    Impreso?: boolean
}

export default function ParaLlevarPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pedidoQuery = searchParams.get("pedido")
    const empleado = useEmpleadoStore((s: any) => s.empleado)

    // Modo creación (sin pedidoId) usa orderItems en memoria; modo edición usa detalles desde BD
    const [pedidoId, setPedidoId] = useState<number | null>(null)
    // Solo se mantiene estado de creación local; la edición vive en el nuevo componente
    const [orderItems, setOrderItems] = useState<DetalleView[]>([])
    const [platos, setPlatos] = useState<Plato[]>([])
    const [filteredPlatos, setFilteredPlatos] = useState<Plato[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [filterCategory, setFilterCategory] = useState<string>("todos")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [tipoPago, setTipoPago] = useState<number | null>(null)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    // Estados de impresión ahora sólo aplican al modo creación; reimpresiones se manejan dentro del componente de edición
    const [mostrarModalImpresion, setMostrarModalImpresion] = useState(false)
        // Estado para el switch de depósito
    const [clienteTraeDeposito, setClienteTraeDeposito] = useState(false)

    // Cargar platos
    useEffect(() => {
        const fetchPlatos = async () => {
            try {
                const r = await fetch("/api/platos")
                if (!r.ok) return
                const data = await r.json()
                const ordenados = ordenarPlatosPorCategoria(data) as Plato[]
                setPlatos(ordenados)
            } catch (_) { }
        }
        fetchPlatos()
    }, [])

    // Filtrado
    useEffect(() => {
        const filtered = platos.filter((p) => p.Descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
        const categoryFiltered = filtered.filter((p) => {
            if (filterCategory === "todos" || filterCategory === "") return true
            return p.CategoriaID === Number(filterCategory)
        })
        setFilteredPlatos(categoryFiltered)
    }, [platos, searchTerm, filterCategory])

    // Resolver si estamos en edición simplemente validando el pedido existente
    useEffect(() => {
        const verificar = async () => {
            if (!pedidoQuery) return
            const idNum = Number(pedidoQuery)
            if (!idNum) return
            setIsLoading(true)
            try {
                const pedidoRes = await fetch(`/api/pedidos/${idNum}`, { cache: 'no-store' })
                if (!pedidoRes.ok) throw new Error('No se pudo cargar pedido')
                const pedido = await pedidoRes.json()
                if (!pedido.ParaLlevar) throw new Error('El pedido no es Para Llevar')
                setPedidoId(pedido.PedidoID)
            } catch (e: any) {
                setError(e.message)
            } finally {
                setIsLoading(false)
            }
        }
        verificar()
    }, [pedidoQuery])

    // --- Creación (sin pedidoId) ---
    // Si PrecioLlevar > 0, se toma como precio final override; si es 0 o null, se usa Precio base
    // Si el cliente trae depósito, usar precio normal; si no, usar PrecioLlevar si existe
    // Visualización de precios según el estado del checkbox
    const precioFinal = (p: Plato) => {
        const base = Number(p.Precio || 0);
        const llevar = Number(p.PrecioLlevar || 0);
        // Si el cliente trae depósito, mostrar precio normal
        // Si no, mostrar precio de llevar si existe
        return clienteTraeDeposito ? base : (llevar > 0 ? llevar : base);
    };
    const addToOrderLocal = (plato: Plato) => {
        const finalPrice = precioFinal(plato);
        const existing = orderItems.find((i) => i.PlatoID === plato.PlatoID);
        if (existing) {
            setOrderItems(orderItems.map((i) => (i.PlatoID === plato.PlatoID ? { ...i, Cantidad: i.Cantidad + 1 } : i)));
        } else {
            setOrderItems([
                ...orderItems,
                { PlatoID: plato.PlatoID, descripcionPlato: plato.Descripcion, Cantidad: 1, PrecioUnitario: finalPrice },
            ]);
        }
    };
    const increaseLocal = (pl: DetalleView) =>
        setOrderItems(orderItems.map((i) => (i.PlatoID === pl.PlatoID ? { ...i, Cantidad: i.Cantidad + 1 } : i)))
    const decreaseLocal = (pl: DetalleView) => {
        const ex = orderItems.find((i) => i.PlatoID === pl.PlatoID)
        if (ex && ex.Cantidad > 1)
            setOrderItems(orderItems.map((i) => (i.PlatoID === pl.PlatoID ? { ...i, Cantidad: i.Cantidad - 1 } : i)))
        else setOrderItems(orderItems.filter((i) => i.PlatoID !== pl.PlatoID))
    }
    const removeLocal = (pl: DetalleView) => setOrderItems(orderItems.filter((i) => i.PlatoID !== pl.PlatoID))
    const clearLocal = () => setOrderItems([])

    const totalLocal = orderItems.reduce((s, i) => s + i.Cantidad * i.PrecioUnitario, 0)

    // handleRealizarPedido para creación Para Llevar
    const handleRealizarPedido = async (): Promise<number | null> => {
        if (!empleado?.EmpleadoID) {
            setError("Empleado no identificado")
            return null
        }
        try {
            const resp = await fetch("/api/pedidos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ EmpleadoID: empleado.EmpleadoID, Fecha: new Date(), ParaLlevar: true, Total: totalLocal }),
            })
            if (!resp.ok) throw new Error("Error al crear pedido")
            const pedido = await resp.json()
            const PedidoID = pedido.PedidoID
            const creados: DetalleView[] = []
            for (const item of orderItems) {
                // Calcular el precio correcto según el switch
                const plato = platos.find(p => p.PlatoID === item.PlatoID);
                let precio = Number(plato?.Precio || 0);
                if (!clienteTraeDeposito && Number(plato?.PrecioLlevar) > 0) {
                    precio = Number(plato?.PrecioLlevar);
                }
                const dResp = await fetch("/api/detallepedidos", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ PedidoID, PlatoID: item.PlatoID, Cantidad: item.Cantidad, PrecioUnitario: precio }),
                })
                if (dResp.ok) {
                    const det = await dResp.json()
                        ; (creados as any).push({
                            DetalleID: det.DetalleID,
                            PlatoID: item.PlatoID,
                            descripcionPlato: item.descripcionPlato,
                            Cantidad: item.Cantidad,
                            PrecioUnitario: precio,
                            Impreso: false,
                        })
                }
            }
            setPedidoId(PedidoID)
            setOrderItems([])
            // Redirigir a modo edición para usar el componente especializado
            router.replace(`/empleado/para-llevar?pedido=${PedidoID}`)
            return PedidoID
        } catch (e: any) {
            setError(e.message)
            return null
        }
    }

    const isCreacion = !pedidoId
    const total = totalLocal

    return (
        <div className="h-full flex flex-col p-4 lg:p-8">
            {/* Header acciones */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold">Pedido Para Llevar {isCreacion ? "(Nuevo)" : `#${pedidoId}`}</h1>
                <div className="flex flex-wrap gap-2 items-center">
                    <Button variant="outline" onClick={() => router.push("/empleado/para-llevar/lista")}>Volver</Button>
                    {/* Switch depósito al lado de Realizar pedido */}
                    {!pedidoId && (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label htmlFor="switch-deposito-header" className="font-medium text-sm">Cliente trae depósito propio</label>
                                <input
                                    id="switch-deposito-header"
                                    type="checkbox"
                                    checked={clienteTraeDeposito}
                                    onChange={e => setClienteTraeDeposito(e.target.checked)}
                                    className="accent-blue-500 w-5 h-5"
                                />
                            </div>
                            <BoletaCocinaModal
                                mode="crear"
                                mesas={[{ NumeroMesa: 0 }]} // marcador PARA LLEVAR
                                orderItems={orderItems.map((i) => ({ PlatoID: i.PlatoID, Descripcion: i.descripcionPlato, Cantidad: i.Cantidad }))}
                                handleRealizarPedido={handleRealizarPedido}
                                onPrintSuccess={() => setMostrarModalImpresion(false)}
                            />
                        </div>
                    )}
                </div>
            </div>
            {!isCreacion && pedidoId && (
                <div className="flex-1">
                    <ModificarPedidoParaLlevar pedidoId={pedidoId} showHeader={false} />
                </div>
            )}

            {isCreacion && (
                <>
                    {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">{error}</div>}
                    <div className="hidden lg:flex flex-1 gap-6">
                        <div className="w-2/3 flex flex-col">
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold mb-4">Menú</h2>
                                <div className="flex gap-4 mb-4">
                                    <div className="relative flex-1">
                                        <Input placeholder="Buscar platos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-3" />
                                    </div>
                                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                                        <SelectTrigger className="w-48 bg-white"><SelectValue placeholder="Todos" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todos">Todos</SelectItem>
                                            <SelectItem value="1">Criollo</SelectItem>
                                            <SelectItem value="2">Bebida</SelectItem>
                                            <SelectItem value="3">Porción</SelectItem>
                                            <SelectItem value="4">Caldo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="border-2 border-blue-400 rounded-lg p-6 bg-white flex-1">
                                <div className="grid grid-cols-3 gap-4 h-full overflow-y-auto scrollbar-thin">
                                    {filteredPlatos.map(p => {
                                        const finalP = precioFinal(p);
                                        return (
                                            <Card key={p.PlatoID} className="cursor-pointer hover:shadow-md bg-gray-100 hover:bg-gray-200 active:scale-95 h-28" onClick={() => addToOrderLocal(p)}>
                                                <CardContent className="p-3 text-center h-full flex flex-col justify-center">
                                                    <h3 className="font-medium text-gray-900 mb-2 text-sm leading-tight line-clamp-2">{p.Descripcion}</h3>
                                                    <p className="text-base font-semibold">
                                                        S/. {finalP.toFixed(2)}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="w-1/3 p-6 border-l bg-gray-50 rounded-lg">
                            <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
                                <div className="bg-slate-700 text-white px-4 py-3 rounded-t-lg flex items-center gap-3">
                                    <ShoppingCart className="w-5 h-5" />
                                    <span className="font-semibold">Detalle</span>
                                    {orderItems.length > 0 && (
                                        <span className="bg-blue-500 text-white rounded-full px-2 py-1 text-sm font-medium">{orderItems.reduce((s, i) => s + i.Cantidad, 0)}</span>
                                    )}
                                </div>
                                <div className="flex-1 p-4 overflow-y-auto space-y-2">
                                    {orderItems.length === 0 ? <p className="text-sm text-center text-gray-500">Sin platos.</p> : orderItems.map(item => (
                                        <div key={item.PlatoID} className="bg-gray-50 p-3 rounded-lg">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <h4 className="font-medium leading-tight mb-1 text-sm">{item.descripcionPlato}</h4>
                                                    <p className="text-xs text-gray-600">
                                                        S/. {item.PrecioUnitario.toFixed(2)} c/u
                                                        <span className="ml-1 text-[10px] text-gray-400 font-normal">
                                                            {clienteTraeDeposito ? "(Precio normal)" : (item.PrecioUnitario > 0 && item.PrecioUnitario !== Number(platos.find(p => p.PlatoID === item.PlatoID)?.Precio) ? "(Para llevar)" : "(Precio normal)")}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="flex items-center gap-1">
                                                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => decreaseLocal(item)}> - </Button>
                                                        <span className="font-semibold text-sm min-w-[20px] text-center">{item.Cantidad}</span>
                                                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => increaseLocal(item)}> + </Button>
                                                        <Button size="sm" variant="destructive" className="h-7 w-7 p-0 ml-1" onClick={() => removeLocal(item)}> x </Button>
                                                    </div>
                                                    <span className="font-semibold text-sm">S/. {(item.PrecioUnitario * item.Cantidad).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {orderItems.length > 0 && (
                                    <div className="border-t p-4 space-y-4">
                                        {/* Switch para depósito */}
                                        <div className="flex items-center gap-3 mb-2">
                                            <label htmlFor="switch-deposito" className="font-medium text-sm">Cliente con Taper</label>
                                            <input
                                                id="switch-deposito"
                                                type="checkbox"
                                                checked={clienteTraeDeposito}
                                                onChange={e => setClienteTraeDeposito(e.target.checked)}
                                                className="accent-blue-500 w-5 h-5"
                                            />
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-semibold">Total:</span>
                                            <span className="text-xl font-bold">S/. {total.toFixed(2)}</span>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={clearLocal} className="w-full text-red-600 border-red-200 hover:bg-red-50">Limpiar pedido</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="lg:hidden flex-1 flex flex-col gap-4">
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Menú</h2>
                            <div className="flex gap-2 mb-3">
                                <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-10" />
                                <Select value={filterCategory} onValueChange={setFilterCategory}>
                                    <SelectTrigger className="w-36 h-10"><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos</SelectItem>
                                        <SelectItem value="1">Criollo</SelectItem>
                                        <SelectItem value="2">Bebida</SelectItem>
                                        <SelectItem value="3">Porción</SelectItem>
                                        <SelectItem value="4">Caldo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto border rounded p-3 bg-white">
                                {filteredPlatos.map(p => {
                                    const finalP = precioFinal(p);
                                    return (
                                        <Card key={p.PlatoID} className="cursor-pointer bg-gray-100 hover:bg-gray-200 active:scale-95 h-24" onClick={() => addToOrderLocal(p)}>
                                            <CardContent className="p-2 flex flex-col justify-center text-center h-full">
                                                <h3 className="text-xs font-medium line-clamp-2 mb-1">{p.Descripcion}</h3>
                                                <p className="text-xs font-semibold">S/. {finalP.toFixed(2)}</p>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <ShoppingCart className="w-4 h-4" />
                                <span className="font-semibold text-sm">Detalle</span>
                            </div>
                            <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                                {orderItems.length === 0 && <p className="text-xs text-gray-500 text-center">Sin platos</p>}
                                {orderItems.map(item => (
                                    <div key={item.PlatoID} className="border rounded p-2 bg-gray-50">
                                        <div className="flex justify-between gap-2">
                                            <div className="flex-1">
                                                <p className="text-xs font-medium line-clamp-2">{item.descripcionPlato}</p>
                                                <p className="text-[10px] text-gray-600">S/. {item.PrecioUnitario.toFixed(2)}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-1">
                                                    <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => decreaseLocal(item)}> - </Button>
                                                    <span className="text-xs font-semibold w-5 text-center">{item.Cantidad}</span>
                                                    <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => increaseLocal(item)}> + </Button>
                                                    <Button size="sm" variant="destructive" className="h-6 w-6 p-0" onClick={() => removeLocal(item)}> x </Button>
                                                </div>
                                                <span className="text-xs font-semibold">S/. {(item.PrecioUnitario * item.Cantidad).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-3 border-t mt-3 flex justify-between text-sm font-semibold">
                                {/* Switch para depósito (mobile) */}
                                <div className="flex items-center gap-2 mb-2">
                                    <label htmlFor="switch-deposito-mobile" className="text-xs font-medium">Cliente trae depósito propio</label>
                                    <input
                                        id="switch-deposito-mobile"
                                        type="checkbox"
                                        checked={clienteTraeDeposito}
                                        onChange={e => setClienteTraeDeposito(e.target.checked)}
                                        className="accent-blue-500 w-4 h-4"
                                    />
                                </div>
                                <span>Total:</span>
                                <span>S/. {total.toFixed(2)}</span>
                            </div>
                            {orderItems.length > 0 && <Button variant="outline" size="sm" onClick={clearLocal} className="w-full mt-2 text-red-600">Limpiar</Button>}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
