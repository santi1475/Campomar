"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Plus, Search, Trash } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface PedidoDetalle {
    DetalleID: number
    PlatoID: number
    descripcionPlato: string
    Cantidad: number
    PrecioUnitario: number
}

interface Props {
    pedidoId: number | null
    detalles: PedidoDetalle[]
    tipoPedido: "Normal" | "ParaLlevar"
    onAddPlatos: (
        items: { PlatoID: number; Cantidad: number; Descripcion: string; ParaLlevar: boolean; PrecioUnitario: number }[],
        comentario: string,
    ) => Promise<void>
}

export default function AgregarPlatosParaLlevar({ pedidoId, detalles, tipoPedido, onAddPlatos }: Props) {
    // Estados principales
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [categoria, setCategoria] = useState("")
    const [platos, setPlatos] = useState<
        { PlatoID: number; Descripcion: string; Precio: number; PrecioLlevar?: number; CategoriaID: number }[]
    >([])
    const [draft, setDraft] = useState<
        { PlatoID: number; Descripcion: string; Precio: number; Cantidad: number; ParaLlevar: boolean }[]
    >([])
    const [modoParaLlevar, setModoParaLlevar] = useState(true)
    const [comentario, setComentario] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Fetch platos solo cuando el modal está abierto
    useEffect(() => {
        if (open) {
            fetch("/api/platos")
                .then((r) => (r.ok ? r.json() : []))
                .then((data) => {
                    // Normalizar datos para evitar nulos y tipos incorrectos
                    const platosAdaptados = Array.isArray(data)
                        ? data.map((pl: any) => ({
                            PlatoID: Number(pl.PlatoID),
                            Descripcion: pl.Descripcion ?? "",
                            Precio: pl.Precio ? Number(pl.Precio) : 0,
                            PrecioLlevar: pl.PrecioLlevar ? Number(pl.PrecioLlevar) : 0,
                            CategoriaID: pl.CategoriaID ? Number(pl.CategoriaID) : 0,
                        }))
                        : []
                    setPlatos(platosAdaptados)
                })
        }
    }, [open])

    // Filtrado y orden natural de platos por categoría
    const ordenCategorias = [4, 3, 2, 6, 7, 1, 8];
    const filtrados = platos
        .filter(p => {
            const texto = p.Descripcion.toLowerCase().includes(search.toLowerCase());
            const catOk = !categoria || categoria === 'todos' || p.CategoriaID === Number(categoria);
            return texto && catOk;
        })
        .sort((a, b) => {
            const indexA = ordenCategorias.indexOf(a.CategoriaID);
            const indexB = ordenCategorias.indexOf(b.CategoriaID);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

    // Agregar plato al draft
    const add = (pl: any) => {
        const esParaLlevar = modoParaLlevar
        const precio =
            !esParaLlevar ? Number(pl.Precio) : (pl.PrecioLlevar && Number(pl.PrecioLlevar) > 0 ? Number(pl.PrecioLlevar) : Number(pl.Precio))
        setDraft((prev) => [
            ...prev,
            {
                PlatoID: pl.PlatoID,
                Descripcion: pl.Descripcion,
                Precio: precio,
                Cantidad: 1,
                ParaLlevar: esParaLlevar,
            },
        ])
    }

    // Toggle modo para llevar global
    const handleToggleModoParaLlevar = () => {
        setModoParaLlevar(!modoParaLlevar)
        // Limpiar el draft cuando cambie el modo para evitar confusiones
        setDraft([])
    }

    // Incrementar cantidad
    const inc = (id: number) =>
        setDraft((prev) => prev.map((i) => (i.PlatoID === id ? { ...i, Cantidad: i.Cantidad + 1 } : i)))
    // Decrementar cantidad
    const dec = (id: number) =>
        setDraft((prev) => prev.map((i) => (i.PlatoID === id ? { ...i, Cantidad: Math.max(1, i.Cantidad - 1) } : i)))
    // Eliminar plato del draft
    const del = (id: number) => setDraft((prev) => prev.filter((i) => i.PlatoID !== id))

    // Calcular total
    const totalDraft = draft.reduce((a, i) => a + i.Precio * i.Cantidad, 0)

    // Submit
    const submit = async () => {
        if (!draft.length || !pedidoId) return
        setIsSubmitting(true)
        try {
            // Determinar si el cliente tiene taper (usa precio normal en vez del precio para llevar)
            const platosConTaper = draft.filter(d => {
                const plato = platos.find(p => p.PlatoID === d.PlatoID);
                // Cliente con taper = usa precio normal cuando debería usar precio para llevar
                const deberiaUsarPrecioLlevar = plato?.PrecioLlevar && Number(plato.PrecioLlevar) > 0;
                const usaPrecioNormal = plato && d.Precio === Number(plato.Precio);
                return deberiaUsarPrecioLlevar && usaPrecioNormal;
            });
            
            let comentarioFinal = comentario;
            // Si hay platos con precio normal, indica que el cliente tiene taper
            if (platosConTaper.length > 0) {
                comentarioFinal = comentario ? `Cliente con taper | ${comentario}` : "Cliente con taper";
            }
            await onAddPlatos(
                draft.map((d) => ({
                    PlatoID: d.PlatoID,
                    Cantidad: d.Cantidad,
                    Descripcion: d.Descripcion,
                    ParaLlevar: d.ParaLlevar,
                    PrecioUnitario: d.Precio, // Ya está correctamente calculado al agregar al draft
                })),
                comentarioFinal,
            )

            // Generar comanda para cocina con los nuevos platos agregados
            const detallesParaComanda = draft.map(item => ({
                PlatoID: item.PlatoID,
                Cantidad: item.Cantidad,
                Descripcion: `${item.Descripcion}${item.ParaLlevar ? ' (P/LLEVAR)' : ''}`
            }));

            console.log("🖨️ Creando comanda para nuevos platos para llevar:", detallesParaComanda);
            console.log("📝 Comentario para nuevos platos para llevar:", comentarioFinal);

            const requestBody = {
                pedidoID: pedidoId,
                comentario: comentarioFinal,
                detalles: detallesParaComanda
            };
            console.log("📤 Enviando request a API:", JSON.stringify(requestBody, null, 2));

            const comandaResponse = await fetch("/api/comanda-cocina", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            if (comandaResponse.ok) {
                const comandaData = await comandaResponse.json();
                console.log("✅ Comanda para llevar creada exitosamente:", {
                    ComandaID: comandaData.ComandaID,
                    Comentario: comandaData.Comentario
                });
                
                alert(`¡Platos agregados! Comanda #${comandaData.ComandaID} enviada a cocina para imprimir solo los nuevos platos.`);
            } else {
                const errorData = await comandaResponse.json();
                console.error("❌ Error al crear comanda para llevar:", errorData);
                alert(`Error al crear la comanda: ${errorData.message}`);
            }

            setDraft([])
            setComentario("")
            setOpen(false)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full bg-transparent">
                    Agregar platos
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] lg:h-[85vh] p-0 overflow-hidden flex flex-col">
                <DialogHeader className="p-3 lg:p-4 border-b shrink-0">
                    <DialogTitle className="text-base lg:text-lg">Agregar platos Para Llevar</DialogTitle>
                    <DialogDescription className="text-xs lg:text-sm">
                        Selecciona nuevos platos para este pedido.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
                    <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r min-h-[40vh] lg:min-h-0">
                        <div className="p-3 lg:p-4 space-y-2 lg:space-y-3 border-b bg-gray-50 shrink-0">
                            <div className="flex gap-2 lg:gap-3 flex-col sm:flex-row">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Buscar..."
                                        className="pl-9 h-9 text-sm"
                                    />
                                </div>
                                <select
                                    value={categoria}
                                    onChange={(e) => setCategoria(e.target.value)}
                                    className="border rounded px-3 py-2 text-sm h-9"
                                >
                                    <option value="">Todas</option>
                                    <option value="todos">Todas</option>
                                    <option value="1">Criollo</option>
                                    <option value="2">Bebida</option>
                                    <option value="3">Porción</option>
                                    <option value="4">Caldo</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <Label htmlFor="modo-para-llevar" className="text-sm font-medium">
                                        Modo Para Llevar
                                    </Label>
                                    <span className="text-xs text-gray-500">
                                        {modoParaLlevar ? "Precios Para Llevar" : "Precios sin Taper"}
                                    </span>
                                </div>
                                <Switch 
                                    id="modo-para-llevar"
                                    checked={modoParaLlevar}
                                    onCheckedChange={handleToggleModoParaLlevar}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 lg:p-3 grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 auto-rows-min">
                            {filtrados.map((pl) => {
                                const esParaLlevar = modoParaLlevar
                                const precioFinal =
                                    !esParaLlevar
                                        ? Number(pl.Precio)
                                        : (pl.PrecioLlevar && Number(pl.PrecioLlevar) > 0 ? Number(pl.PrecioLlevar) : Number(pl.Precio))
                                return (
                                    <Card key={pl.PlatoID} className="cursor-pointer hover:shadow-md transition-shadow">
                                        <CardContent
                                            className="p-2 lg:p-3 flex flex-col items-center text-center gap-1"
                                            onClick={() => add(pl)}
                                        >
                                            <span className="text-xs lg:text-sm font-medium line-clamp-2 break-words w-full min-h-[2.5rem] flex items-center justify-center">
                                                {pl.Descripcion}
                                            </span>
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-sm lg:text-base font-semibold text-blue-600">
                                                    S/. {precioFinal.toFixed(2)}
                                                </span>
                                                {!esParaLlevar ? (
                                                    <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                        Sin Taper
                                                    </span>
                                                ) : esParaLlevar && pl.PrecioLlevar && Number(pl.PrecioLlevar) > 0 ? (
                                                    <span className="text-[10px] text-orange-600 font-medium bg-orange-100 px-1.5 py-0.5 rounded">
                                                        Con Taper
                                                    </span>
                                                ) : null}
                                            </div>
                                        </CardContent>

                                    </Card>
                                )
                            })}
                            {!filtrados.length && (
                                <p className="col-span-full text-xs text-muted-foreground text-center py-4">Sin resultados</p>
                            )}
                        </div>
                    </div>
                    <div className="w-full lg:w-80 flex flex-col min-h-[35vh] lg:min-h-0 lg:max-h-full">
                        <div className="p-3 lg:p-4 border-b bg-gray-50 flex items-center justify-between shrink-0">
                            <span className="font-semibold text-sm">Nuevos platos ({draft.reduce((a, i) => a + i.Cantidad, 0)})</span>
                            {draft.length > 0 && (
                                <Button size="sm" variant="ghost" onClick={() => setDraft([])} className="text-red-600 h-7 text-xs">
                                    Limpiar
                                </Button>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 lg:p-3 space-y-2 lg:space-y-3">
                            {draft.map((item) => (
                                <div key={item.PlatoID} className="border rounded p-2 text-xs space-y-1.5 bg-white shadow-sm">
                                    <div className="flex justify-between items-start gap-2">
                                        <span className="font-medium flex-1 line-clamp-2 text-xs lg:text-sm">{item.Descripcion}</span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-red-600 shrink-0"
                                            onClick={() => del(item.PlatoID)}
                                        >
                                            <Trash className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 w-7 p-0 text-base bg-transparent"
                                                onClick={() => dec(item.PlatoID)}
                                            >
                                                -
                                            </Button>
                                            <span className="font-semibold w-8 text-center text-sm">{item.Cantidad}</span>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 w-7 p-0 text-base bg-transparent"
                                                onClick={() => inc(item.PlatoID)}
                                            >
                                                +
                                            </Button>
                                        </div>
                                        <span className="font-semibold text-blue-600 text-sm">
                                            S/. {(item.Precio * item.Cantidad).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {!draft.length && (
                                <p className="text-xs text-muted-foreground text-center py-4">No has seleccionado platos nuevos.</p>
                            )}
                        </div>
                        <div className="p-3 lg:p-4 border-t space-y-2 lg:space-y-3 shrink-0 bg-white">
                            <div>
                                <label className="text-xs font-medium mb-1 block">Comentario (opcional)</label>
                                <Textarea
                                    rows={2}
                                    value={comentario}
                                    onChange={(e) => setComentario(e.target.value)}
                                    placeholder="Instrucciones para cocina"
                                    className="text-sm"
                                />
                            </div>
                            <div className="flex items-center justify-between text-sm font-semibold">
                                <span>Total nuevos:</span>
                                <span className="text-base">S/. {totalDraft.toFixed(2)}</span>
                            </div>
                            <Button disabled={!draft.length || !pedidoId || isSubmitting} onClick={submit} className="w-full h-10">
                                {isSubmitting ? "Agregando..." : "Agregar al pedido"}
                            </Button>
                            <Button variant="outline" onClick={() => setOpen(false)} className="w-full h-10">
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
