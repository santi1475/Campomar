"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, RefreshCw, Filter, Loader2, ChevronsDownUp } from "lucide-react";

interface HistorialPlato {
    DetalleID: number;
    PlatoID: number;
    Descripcion: string | null;
    Cantidad: number;
    Subtotal: number;
}
interface HistorialPedido {
    PedidoID: number;
    Fecha: string; // ISO
    Empleado: string | null;
    EmpleadoID: number;
    MetodoPagoID: number | null;
    MetodoPago: string | null;
    ParaLlevar?: boolean;
    Total: string; // decimal en BD
    Platos: HistorialPlato[];
}
interface HistorialResponse {
    fecha: string;
    timezone: string;
    rangoUTC: { inicio: string; fin: string };
    count: number;
    pedidos: HistorialPedido[];
}
interface EmpleadoOption { EmpleadoID: number; Nombre: string | null }

const metodoPagoColors: Record<number, string> = {
    1: "bg-green-100 text-green-700 border-green-300",
    2: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300",
    3: "bg-orange-100 text-orange-700 border-orange-300",
};

function formatHoraLima(iso: string) {
    try {
        const date = new Date(iso);
        return date.toLocaleTimeString("es-PE", { timeZone: "America/Lima", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
        return "";
    }
}

export default function HistorialPagosPage() {
    const hoyLima = useMemo(() => {
        const now = new Date();
        // Obtener fecha local Lima formateada YYYY-MM-DD
        const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
        return partes; // en-CA => YYYY-MM-DD
    }, []);

    // Filtros
    const [fecha, setFecha] = useState<string>(hoyLima);
    const [empleadoId, setEmpleadoId] = useState<string>("");
    const [metodoPago, setMetodoPago] = useState<string>("");
    const [soloParaLlevar, setSoloParaLlevar] = useState<string>("");

    // Datos
    const [data, setData] = useState<HistorialPedido[]>([]);
    const [empleados, setEmpleados] = useState<EmpleadoOption[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<number | null>(null);
    const [meta, setMeta] = useState<{ total: number; count: number }>({ total: 0, count: 0 });

    const buildQuery = () => {
        const params = new URLSearchParams();
        if (fecha) params.set("fecha", fecha);
        if (empleadoId) params.set("empleadoId", empleadoId);
        if (metodoPago) params.set("metodoPago", metodoPago);
        if (soloParaLlevar) params.set("paraLlevar", soloParaLlevar);
        return params.toString();
    };

    const fetchHistorial = async () => {
        setLoading(true);
        setError(null);
        try {
            const qs = buildQuery();
            // Añadimos timestamp para bust de caché y cache: 'no-store' para evitar almacenamiento
            const res = await fetch(`/api/historial-pagos?${qs}&_=${Date.now()}`, { cache: 'no-store' });
            if (!res.ok) throw new Error("No se pudo obtener historial");
            const json: HistorialResponse = await res.json();
            setData(json.pedidos);
            const total = json.pedidos.reduce((acc, p) => acc + parseFloat(p.Total), 0);
            setMeta({ total, count: json.count });
        } catch (e: any) {
            setError(e.message || "Error desconocido");
        } finally {
            setLoading(false);
        }
    };

    const fetchEmpleados = async () => {
        try {
            const res = await fetch(`/api/empleados?_=${Date.now()}`, { cache: 'no-store' });
            if (!res.ok) return;
            const json = await res.json();
            setEmpleados(json);
        } catch {
            // ignorar
        }
    };

    useEffect(() => {
        fetchEmpleados();
    }, []);

    useEffect(() => {
        fetchHistorial();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fecha, empleadoId, metodoPago, soloParaLlevar]);

    const resetFiltros = () => {
        setFecha(hoyLima);
        setEmpleadoId("");
        setMetodoPago("");
        setSoloParaLlevar("");
    };

    const exportCSV = () => {
        const headers = ["PedidoID", "Hora", "Empleado", "MetodoPago", "Total", "Platos"];
        const rows = data.map(p => {
            const platos = p.Platos.map(pl => `${pl.Cantidad}x ${pl.Descripcion}`).join(" | ");
            return [p.PedidoID, formatHoraLima(p.Fecha), p.Empleado || "-", p.MetodoPago || "-", p.Total, platos];
        });
        const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `historial_${fecha}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <Card className="shadow-md">
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">Historial de Pagos (Diario)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filtros */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium">Fecha (Lima)</label>
                            <input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                className="border rounded-md px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium">Empleado</label>
                            <select
                                value={empleadoId}
                                onChange={(e) => setEmpleadoId(e.target.value)}
                                disabled={loading}
                                className="border rounded-md px-3 py-2 text-sm bg-white disabled:opacity-60"
                            >
                                <option value="">Todos</option>
                                {empleados.map(emp => (
                                    <option key={emp.EmpleadoID} value={emp.EmpleadoID}>{emp.Nombre || `Empleado ${emp.EmpleadoID}`}</option>
                                ))}
                            </select>
                            {loading && <div className="text-xs text-muted-foreground py-1">Cargando...</div>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium">Método Pago</label>
                            <select
                                value={metodoPago}
                                onChange={(e) => setMetodoPago(e.target.value)}
                                disabled={loading}
                                className="border rounded-md px-3 py-2 text-sm bg-white disabled:opacity-60"
                            >
                                <option value="">Todos</option>
                                <option value="1">Efectivo</option>
                                <option value="2">Yape</option>
                                <option value="3">POS</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium">Para Llevar</label>
                            <select
                                value={soloParaLlevar}
                                onChange={(e) => setSoloParaLlevar(e.target.value)}
                                disabled={loading}
                                className="border rounded-md px-3 py-2 text-sm bg-white disabled:opacity-60"
                            >
                                <option value="">Todos</option>
                                <option value="true">Sólo Para Llevar</option>
                                <option value="false">Sin Para Llevar</option>
                            </select>
                        </div>
                        <div className="flex gap-2 md:col-span-2">
                            <Button variant="outline" className="flex-1" onClick={resetFiltros}>
                                <Filter className="w-4 h-4 mr-1" /> Reset
                            </Button>
                            <Button variant="outline" className="flex-1" onClick={fetchHistorial} disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />} Refrescar
                            </Button>
                            <Button variant="outline" onClick={exportCSV} className="hidden md:inline-flex">
                                <Download className="w-4 h-4 mr-1" /> CSV
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {/* Resumen */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm">
                        <div className="flex flex-wrap gap-3">
                            <Badge variant="outline" className="px-3 py-1 font-medium">Pedidos: {meta.count}</Badge>
                            <Badge variant="outline" className="px-3 py-1 font-medium">Total S/. {meta.total.toFixed(2)}</Badge>
                            {metodoPago && (
                                <Badge variant="secondary" className="px-3 py-1">Filtro: {metodoPago === '1' ? 'Efectivo' : metodoPago === '2' ? 'Yape' : 'POS'}</Badge>
                            )}
                        </div>
                        <div className="text-muted-foreground">Zona horaria: America/Lima</div>
                    </div>

                    {/* Tabla */}
                    <div className="overflow-x-auto rounded-md border mt-2">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">ID</TableHead>
                                    <TableHead className="min-w-[90px]">Hora</TableHead>
                                    <TableHead>Empleado</TableHead>
                                    <TableHead>Método</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="min-w-[140px]">Platos</TableHead>
                                    <TableHead className="w-24">Tipo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                            <span className="text-sm text-muted-foreground">Cargando...</span>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading && data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                                            No hay registros para los filtros seleccionados.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading && data.map(p => {
                                    const isExp = expanded === p.PedidoID;
                                    return (
                                        <React.Fragment key={p.PedidoID}>
                                            <TableRow className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(isExp ? null : p.PedidoID)}>
                                                <TableCell className="font-medium flex items-center gap-1">
                                                    {p.PedidoID}
                                                    <ChevronsDownUp className={`w-3 h-3 transition-opacity ${isExp ? 'opacity-100' : 'opacity-30'}`} />
                                                </TableCell>
                                                <TableCell>{formatHoraLima(p.Fecha)}</TableCell>
                                                <TableCell>{p.Empleado || '-'}</TableCell>
                                                <TableCell>
                                                    {p.MetodoPagoID ? (
                                                        <span className={`text-xs px-2 py-1 rounded-full border inline-block ${metodoPagoColors[p.MetodoPagoID] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                                                            {p.MetodoPago || 'N/D'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">N/D</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">S/. {parseFloat(p.Total).toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1 max-w-[280px]">
                                                        {p.Platos.slice(0, 3).map(pl => (
                                                            <Badge key={pl.DetalleID} variant="outline" className="text-[10px] font-normal">
                                                                {pl.Cantidad}x {pl.Descripcion}
                                                            </Badge>
                                                        ))}
                                                        {p.Platos.length > 3 && (
                                                            <Badge variant="secondary" className="text-[10px]">+{p.Platos.length - 3}</Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {p.ParaLlevar ? (
                                                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-indigo-300 text-[10px]">Para Llevar</Badge>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground">Mesa</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                            {isExp && (
                                                <TableRow className="bg-muted/30" key={`exp-${p.PedidoID}-detail`}>
                                                    <TableCell colSpan={7} className="p-4">
                                                        <div className="text-xs font-medium mb-2 text-muted-foreground">Detalle de platos</div>
                                                        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                                            {p.Platos.map(pl => (
                                                                <div key={pl.DetalleID} className="border rounded-md p-2 bg-white shadow-sm text-xs flex flex-col gap-1">
                                                                    <div className="font-semibold truncate">{pl.Descripcion}</div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-muted-foreground">Cant:</span>
                                                                        <span>{pl.Cantidad}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-muted-foreground">Subtotal:</span>
                                                                        <span>S/. {pl.Subtotal.toFixed(2)}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
