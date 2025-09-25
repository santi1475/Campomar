"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Clock, CheckCircle } from "lucide-react";

interface Pedido {
    PedidoID: number;
    Fecha: string;
    Total: string;
    empleados: { Nombre: string | null };
    detallepedidos: Array<{
        DetalleID: number;
        Cantidad: number;
        platos: { Descripcion: string | null };
        Impreso: boolean;
    }>;
}

export function PedidosParaLlevarActivos() {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch("/api/pedidos-activos-para-llevar")
            .then(res => res.json())
            .then(data => setPedidos(data.pedidos || []))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="w-full mt-6">
            <Card className="shadow-md">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                        <Package className="w-5 h-5 text-orange-600" />
                        Pedidos para Llevar Activos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                        </div>
                    ) : pedidos.length === 0 ? (
                        <div className="flex flex-col items-center py-8 gap-2">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                            <span className="text-sm text-muted-foreground">No hay pedidos para llevar activos</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pedidos.map(p => {
                                const hora = new Date(p.Fecha).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
                                const urgente = (Date.now() - new Date(p.Fecha).getTime()) / 60000 > 30;
                                return (
                                    <Card key={p.PedidoID} className={`border-2 ${urgente ? 'border-red-400' : 'border-orange-200'} relative`}>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 text-xs">ID {p.PedidoID}</Badge>
                                                <Badge variant="outline" className="bg-white text-gray-700 border-gray-300 text-xs">{hora}</Badge>
                                                {urgente && <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs">URGENTE</Badge>}
                                            </div>
                                            <div className="mt-1 text-sm text-gray-700 font-medium">{p.empleados?.Nombre || "-"}</div>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div className="flex flex-wrap gap-1">
                                                {p.detallepedidos.map(pl => (
                                                    <Badge key={pl.DetalleID} variant={pl.Impreso ? "outline" : "secondary"} className={`text-[10px] font-normal ${pl.Impreso ? "border-green-300 text-green-700 bg-green-50" : "bg-yellow-100 text-yellow-800 border-yellow-300"}`}>
                                                        {pl.Cantidad}x {pl.platos?.Descripcion}
                                                        {!pl.Impreso && " ⏳"}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-xs text-gray-500">Total:</span>
                                                <span className="font-bold text-orange-700">S/. {parseFloat(p.Total).toFixed(2)}</span>
                                            </div>
                                        </CardContent>
                                        {urgente && <div className="absolute top-2 right-2"><Clock className="w-4 h-4 text-red-500" /></div>}
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
