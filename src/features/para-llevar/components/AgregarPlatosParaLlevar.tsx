"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, X, Trash } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Plato { PlatoID: number; Descripcion: string; Precio: any; CategoriaID: number }
interface PedidoDetalle { DetalleID: number; PlatoID: number; descripcionPlato: string; Cantidad: number; PrecioUnitario: number }

interface Props {
    pedidoId: number | null;
    detalles: PedidoDetalle[];
    onAddPlatos: (items: { PlatoID: number; Cantidad: number; Descripcion: string }[], comentario: string) => Promise<void>;
}

export default function AgregarPlatosParaLlevar({ pedidoId, detalles, onAddPlatos }: Props) {
    const [open, setOpen] = useState(false);
    const [platos, setPlatos] = useState<Plato[]>([]);
    const [search, setSearch] = useState("");
    const [categoria, setCategoria] = useState("");
    const [draft, setDraft] = useState<{ PlatoID: number; Descripcion: string; Precio: number; Cantidad: number }[]>([]);
    const [comentario, setComentario] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { if (open) { fetch('/api/platos').then(r => r.ok ? r.json() : []).then(d => setPlatos(d)); } }, [open]);

    const filtrados = platos.filter(p => {
        const texto = p.Descripcion.toLowerCase().includes(search.toLowerCase());
        const catOk = !categoria || categoria === 'todos' || p.CategoriaID === Number(categoria);
        const noRepetido = !detalles.some(d => d.PlatoID === p.PlatoID) && !draft.some(d => d.PlatoID === p.PlatoID);
        return texto && catOk && noRepetido;
    });

    const add = (pl: Plato) => {
        setDraft(prev => [...prev, { PlatoID: pl.PlatoID, Descripcion: pl.Descripcion, Precio: Number(pl.Precio) || 0, Cantidad: 1 }]);
    };
    const inc = (id: number) => setDraft(prev => prev.map(i => i.PlatoID === id ? { ...i, Cantidad: i.Cantidad + 1 } : i));
    const dec = (id: number) => setDraft(prev => prev.map(i => i.PlatoID === id ? { ...i, Cantidad: Math.max(1, i.Cantidad - 1) } : i));
    const del = (id: number) => setDraft(prev => prev.filter(i => i.PlatoID !== id));

    const totalDraft = draft.reduce((a, i) => a + i.Precio * i.Cantidad, 0);

    const submit = async () => {
        if (!draft.length || !pedidoId) return;
        setIsSubmitting(true);
        try {
            await onAddPlatos(draft.map(d => ({ PlatoID: d.PlatoID, Cantidad: d.Cantidad, Descripcion: d.Descripcion })), comentario);
            setDraft([]); setComentario(""); setOpen(false);
        } finally { setIsSubmitting(false); }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">Agregar platos</Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 overflow-hidden flex flex-col">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Agregar platos Para Llevar</DialogTitle>
                    <DialogDescription>Selecciona nuevos platos para este pedido.</DialogDescription>
                </DialogHeader>
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    <div className="flex-1 flex flex-col border-r min-h-0">
                        <div className="p-4 space-y-3 border-b bg-gray-50">
                            <div className="flex gap-3 flex-col sm:flex-row">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9" />
                                </div>
                                <select value={categoria} onChange={e => setCategoria(e.target.value)} className="border rounded px-3 py-2 text-sm">
                                    <option value="">Todas</option>
                                    <option value="todos">Todas</option>
                                    <option value="1">Criollo</option>
                                    <option value="2">Bebida</option>
                                    <option value="3">Porción</option>
                                    <option value="4">Caldo</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                            {filtrados.map(pl => (
                                <Card key={pl.PlatoID} className="cursor-pointer hover:shadow-sm" onClick={() => add(pl)}>
                                    <CardContent className="p-3 flex flex-col items-center text-center gap-1">
                                        <span className="text-xs font-medium line-clamp-2">{pl.Descripcion}</span>
                                        <span className="text-sm font-semibold text-blue-600">S/. {Number(pl.Precio).toFixed(2)}</span>
                                        <Plus className="w-4 h-4 text-gray-500" />
                                    </CardContent>
                                </Card>
                            ))}
                            {!filtrados.length && <p className="col-span-full text-xs text-muted-foreground">Sin resultados</p>}
                        </div>
                    </div>
                    <div className="w-full lg:w-80 flex flex-col h-full">
                        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                            <span className="font-semibold text-sm">Nuevos platos ({draft.reduce((a, i) => a + i.Cantidad, 0)})</span>
                            {draft.length > 0 && <Button size="sm" variant="ghost" onClick={() => setDraft([])} className="text-red-600">Limpiar</Button>}
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {draft.map(item => (
                                <div key={item.PlatoID} className="border rounded p-2 text-xs space-y-1 bg-white">
                                    <div className="flex justify-between items-start gap-2">
                                        <span className="font-medium flex-1 line-clamp-2">{item.Descripcion}</span>
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-600" onClick={() => del(item.PlatoID)}><Trash className="w-3 h-3" /></Button>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1">
                                            <Button size="sm" variant="outline" className="h-6 px-2" onClick={() => dec(item.PlatoID)}>-</Button>
                                            <span className="font-semibold w-6 text-center">{item.Cantidad}</span>
                                            <Button size="sm" variant="outline" className="h-6 px-2" onClick={() => inc(item.PlatoID)}>+</Button>
                                        </div>
                                        <span className="font-semibold text-blue-600">S/. {(item.Precio * item.Cantidad).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                            {!draft.length && <p className="text-xs text-muted-foreground">No has seleccionado platos nuevos.</p>}
                        </div>
                        <div className="p-4 border-t space-y-3">
                            <div>
                                <label className="text-xs font-medium mb-1 block">Comentario (opcional)</label>
                                <Textarea rows={2} value={comentario} onChange={e => setComentario(e.target.value)} placeholder="Instrucciones para cocina" />
                            </div>
                            <div className="flex items-center justify-between text-sm font-semibold">
                                <span>Total nuevos:</span>
                                <span>S/. {totalDraft.toFixed(2)}</span>
                            </div>
                            <Button disabled={!draft.length || !pedidoId || isSubmitting} onClick={submit} className="w-full">
                                {isSubmitting ? 'Agregando...' : 'Agregar al pedido'}
                            </Button>
                            <Button variant="outline" onClick={() => setOpen(false)} className="w-full">Cerrar</Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
