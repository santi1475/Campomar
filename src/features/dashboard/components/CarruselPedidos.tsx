// src/features/dashboard/components/CarruselPedidos.tsx
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Clock, User, Utensils, ShoppingBag, Search, ArrowUp, ArrowDown, ChevronDown, ChevronUp } from "lucide-react";

interface PedidoActivo {
    PedidoID: number;
    Fecha: string;
    Total: number;
    ParaLlevar: boolean;
    empleados: { Nombre: string | null } | null;
    pedido_mesas: { mesas: { NumeroMesa: number } | null }[];
    detallepedidos: {
        Cantidad: number;
        platos: { Descripcion: string | null } | null;
    }[];
}

interface Empleado {
    EmpleadoID: number;
    Nombre: string | null;
}

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <label className={className}>{children}</label>
);

export const CarruselPedidos = () => {
    const [pedidos, setPedidos] = useState<PedidoActivo[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [filtroTipo, setFiltroTipo] = useState<'todos' | 'mesas' | 'llevar'>('todos');
    const [filtroSort, setFiltroSort] = useState<'asc' | 'desc'>('asc');
    const [filtroMesa, setFiltroMesa] = useState<string>("");
    const [filtroEmpleado, setFiltroEmpleado] = useState<string>("todos");

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const knownOrderIds = useRef<Set<number>>(new Set());
    const isFirstLoad = useRef(true);

    const fetchPedidos = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad) setLoading(true);

        const params = new URLSearchParams();
        params.set('tipo', filtroTipo);
        params.set('sort', filtroSort);
        if (filtroMesa.trim()) params.set('mesa', filtroMesa.trim());
        if (filtroEmpleado) params.set('empleado', filtroEmpleado);

        try {
            const res = await fetch(
                `/api/admin/cola-pedidos?_=${Date.now()}&${params.toString()}`,
                { cache: 'no-store' }
            );
            if (!res.ok) throw new Error(`Error ${res.status}`);

            const data: PedidoActivo[] = await res.json();

            let hayNuevos = false;
            const currentIds = new Set<number>();

            data.forEach(p => {
                currentIds.add(p.PedidoID);
                if (!knownOrderIds.current.has(p.PedidoID)) {
                    hayNuevos = true;
                }
            });

            if (hayNuevos && !isFirstLoad.current) {
                console.log("🔔 Nuevo pedido detectado, reproduciendo sonido...");
                audioRef.current?.play().catch(e => console.warn("No se pudo reproducir audio:", e));
            }

            knownOrderIds.current = currentIds;
            setPedidos(data);

            if (isFirstLoad.current) isFirstLoad.current = false;

        } catch (error) {
            console.error("Error polling pedidos:", error);
        } finally {
            setLoading(false);
        }
    }, [filtroTipo, filtroSort, filtroMesa, filtroEmpleado]);

    const formatTime = (fechaISO: string) => {
        return new Date(fechaISO).toLocaleTimeString("es-PE", {
            hour: '2-digit', minute: '2-digit'
        });
    };

    const toggleExpand = (pedidoId: number) => {
        setExpandedOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(pedidoId)) {
                newSet.delete(pedidoId);
            } else {
                newSet.add(pedidoId);
            }
            return newSet;
        });
    };

    // useEffect #1
    useEffect(() => {
        // audioRef.current = new Audio("/src/assets/ding.mp3");
        // audioRef.current.volume = 1;

        const fetchEmpleados = async () => {
            try {
                const res = await fetch('/api/empleados');
                if (res.ok) {
                    const data: Empleado[] = await res.json();
                    setEmpleados(data.filter(e => e.Nombre));
                }
            } catch (e) {
                console.error("Error al cargar empleados:", e);
            }
        };
        fetchEmpleados();

        fetchPedidos(true); // ✅ Ahora sin warnings
        const interval = setInterval(() => fetchPedidos(false), 5000);

        return () => clearInterval(interval);
    }, [fetchPedidos]); // ✅ Incluir fetchPedidos como dependencia

    // useEffect #2
    useEffect(() => {
        if (isFirstLoad.current) return;

        const handler = setTimeout(() => {
            knownOrderIds.current.clear();
            isFirstLoad.current = true;
            fetchPedidos(true); // ✅ Sin warnings
        }, 500);

        return () => clearTimeout(handler);
    }, [filtroTipo, filtroSort, filtroMesa, filtroEmpleado, fetchPedidos]);

    return (
        <div className="w-full mb-6">
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-brandSecondary" />
                    Cola de Pedidos (Tiempo Real)
                </h2>
                <Badge variant="outline" className="bg-white">
                    {loading ? "Conectando..." : `${pedidos.length} activos`}
                </Badge>
            </div>
            <Card className="mb-4 bg-white/70 backdrop-blur-sm p-3 shadow-sm border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                    {/* Filtro: Tipo (Mesas/Llevar) */}
                    <div className="flex flex-col gap-1">
                        <Label className="text-xs font-medium text-gray-600">Tipo</Label>
                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                variant={filtroTipo === 'todos' ? 'default' : 'outline'}
                                onClick={() => setFiltroTipo('todos')}
                                className="flex-1 data-[state=active]:bg-brandSecondary"
                            >Todos</Button>
                            <Button
                                size="sm"
                                variant={filtroTipo === 'mesas' ? 'default' : 'outline'}
                                onClick={() => setFiltroTipo('mesas')}
                                className="flex-1 data-[state=active]:bg-brandSecondary"
                            >Mesas</Button>
                            <Button
                                size="sm"
                                variant={filtroTipo === 'llevar' ? 'default' : 'outline'}
                                onClick={() => setFiltroTipo('llevar')}
                                className="flex-1 data-[state=active]:bg-brandSecondary"
                            >Llevar</Button>
                        </div>
                    </div>

                    {/* Filtro: Orden (Recientes/Últimos) */}
                    <div className="flex flex-col gap-1">
                        <Label className="text-xs font-medium text-gray-600">Ordenar Por</Label>
                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                variant={filtroSort === 'asc' ? 'default' : 'outline'}
                                onClick={() => setFiltroSort('asc')}
                                className="flex-1 data-[state=active]:bg-blue-600"
                            ><ArrowUp size={14} className="mr-1" /> Primeros</Button>
                            <Button
                                size="sm"
                                variant={filtroSort === 'desc' ? 'default' : 'outline'}
                                onClick={() => setFiltroSort('desc')}
                                className="flex-1 data-[state=active]:bg-blue-600"
                            ><ArrowDown size={14} className="mr-1" /> Recientes</Button>
                        </div>
                    </div>

                    {/* Filtro: Empleado */}
                    <div className="flex flex-col gap-1">
                        <Label className="text-xs font-medium text-gray-600">Empleado</Label>
                        <Select value={filtroEmpleado} onValueChange={(val) => setFiltroEmpleado(val)}>
                            <SelectTrigger className="bg-white h-9 text-sm">
                                <SelectValue placeholder="Todos los empleados" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos los empleados</SelectItem>
                                {empleados.map(emp => (
                                    <SelectItem key={emp.EmpleadoID} value={String(emp.EmpleadoID)}>
                                        {emp.Nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filtro: Número de Mesa */}
                    <div className="flex flex-col gap-1">
                        <Label className="text-xs font-medium text-gray-600">Buscar Mesa</Label>
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="number"
                                placeholder="N° de Mesa"
                                value={filtroMesa}
                                onChange={(e) => setFiltroMesa(e.target.value)}
                                className="pl-8 bg-white h-9 text-sm"
                            />
                        </div>
                    </div>

                </div>
            </Card>
            <div className="flex flex-col gap-3 w-full max-h-[calc(100vh-200px)] overflow-y-auto pr-2">

                {loading && pedidos.length === 0 && (
                    <div className="w-full py-10 flex justify-center text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando pedidos...
                    </div>
                )}

                {!loading && pedidos.length === 0 && (
                    <div className="w-full py-8 bg-white rounded-lg border-2 border-dashed border-gray-200 text-center text-gray-400">
                        No hay pedidos activos en este momento.
                    </div>
                )}

                {pedidos.map((p, index) => {
                    const isExpanded = expandedOrders.has(p.PedidoID);
                    const hasMoreItems = p.detallepedidos.length > 2;
                    const visibleItems = isExpanded ? p.detallepedidos : p.detallepedidos.slice(0, 2);

                    return (
                        <Card
                            key={p.PedidoID}
                            className="mx-9 bg-white border-l-4 border-l-brandSecondary shadow-sm hover:shadow-md transition-shadow"
                        >
                            <CardHeader className="p-3 pb-2 bg-gray-50/50">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brandSecondary text-white font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-gray-500">#{p.PedidoID}</span>
                                            <h3 className="font-bold text-lg leading-none text-gray-800 mt-1">
                                                {p.ParaLlevar ? (
                                                    <span className="flex items-center text-orange-600 gap-1"><ShoppingBag size={16} /> P. Llevar</span>
                                                ) : (
                                                    <span>Mesa {p.pedido_mesas.map(m => m.mesas?.NumeroMesa).join(", ") || "?"}</span>
                                                )}
                                            </h3>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="text-s font-mono">
                                        {formatTime(p.Fecha)}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className=" p-5 pt-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                    <User className="w-3 h-3" />
                                    {p.empleados?.Nombre || "Sin asignar"}
                                </div>

                                <div className="space-y-1 border-t pt-2">
                                    {visibleItems.map((d, i) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="font-semibold text-gray-700 text-lg">{d.Cantidad}x</span>
                                            <span className="truncate text-gray-600 ml-3 flex-1 text-lg">
                                                {d.platos?.Descripcion || "..."}
                                            </span>
                                        </div>
                                    ))}
                                    {p.detallepedidos.length === 0 && (
                                        <p className="text-l text-gray-400 italic">Sin platos aún</p>
                                    )}
                                </div>

                                {hasMoreItems && (
                                    <div className="mt-2 flex justify-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleExpand(p.PedidoID)}
                                            className="text-xs h-7 text-brandSecondary hover:bg-brandSecondary/10 w-full"
                                        >
                                            {isExpanded ? (
                                                <>
                                                    <ChevronUp className="w-4 h-4 mr-1" />
                                                    Ver menos ({p.detallepedidos.length})
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="w-4 h-4 mr-1" />
                                                    Ver más ({p.detallepedidos.length - 2} más)
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}

                                <div className="mt-3 pt-2 border-t flex justify-between items-center">
                                    <span className="text-xs text-gray-500">Total</span>
                                    <span className="text-m font-bold text-brandSecondary">S/. {Number(p.Total).toFixed(2)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
