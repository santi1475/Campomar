"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEmpleadoStore } from "@/store/empleado";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ShoppingCart, Minus, Plus, Trash, Printer, X, Check, ChevronUp, ChevronDown } from "lucide-react";
import BoletaCocinaModal from "@/features/impresion-cocina/components/BoletaCocinaModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MesaOcupadaAgregar } from "@/features/pedidos-activos/components/ModalAgregarPlato";
import ModalIncrementarPlatos from "@/features/pedidos-activos/components/ModalIncrementarPlatos";

interface Plato { PlatoID: number; Descripcion: string; Precio: any; CategoriaID: number }
interface DetalleView { DetalleID: number; PlatoID: number; descripcionPlato: string; Cantidad: number; PrecioUnitario: number; Impreso: boolean }

interface Props { pedidoId: number; showHeader?: boolean }

export default function ModificarPedidoParaLlevar({ pedidoId, showHeader = true }: Props) {
    const router = useRouter();
    const empleado = useEmpleadoStore((s: any) => s.empleado);
    const [pedido, setPedido] = useState<any | null>(null);
    const [detalles, setDetalles] = useState<DetalleView[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tipoPago, setTipoPago] = useState<number | null>(null);
    const [platosNuevos, setPlatosNuevos] = useState<DetalleView[]>([]);
    const [mostrarModalImpresion, setMostrarModalImpresion] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isPlatosOpen, setIsPlatosOpen] = useState<boolean>(false);
    const [isYapeDialogOpen, setIsYapeDialogOpen] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isModalIncrementarOpen, setIsModalIncrementarOpen] = useState(false);

    const fetchPedido = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Obtener datos del pedido
            const pedidoResponse = await fetch(`/api/pedidos/${pedidoId}`, { cache: 'no-store' });
            if (!pedidoResponse.ok) throw new Error("Error al obtener el pedido");
            const pedidoData = await pedidoResponse.json();

            // Obtener detalles del pedido con información de platos
            let detallesConPlatos: any[] = [];

            // Primero intentar obtener desde el endpoint específico
            const detRes = await fetch(`/api/pedidos/${pedidoId}/detalles?t=${Date.now()}`, { cache: 'no-store' });
            if (detRes.ok) {
                detallesConPlatos = await detRes.json();
            }

            // Si no funcionó o no hay datos, usar fallback
            if (!detRes.ok || !detallesConPlatos.length) {
                // Obtener detalles básicos
                const allRes = await fetch('/api/detallepedidos', { cache: 'no-store' });
                if (allRes.ok) {
                    const todosLosDetalles = await allRes.json();
                    const detallesPedido = todosLosDetalles.filter((d: any) => d.PedidoID === pedidoId);

                    // Obtener información de platos
                    const platosRes = await fetch('/api/platos', { cache: 'no-store' });
                    let platos: any[] = [];
                    if (platosRes.ok) {
                        platos = await platosRes.json();
                    }

                    // Combinar detalles con información de platos
                    detallesConPlatos = detallesPedido.map((detalle: any) => {
                        const plato = platos.find((p: any) => p.PlatoID === detalle.PlatoID);
                        return {
                            DetalleID: detalle.DetalleID,
                            PlatoID: detalle.PlatoID,
                            Cantidad: detalle.Cantidad,
                            Impreso: detalle.Impreso,
                            Descripcion: plato ? plato.Descripcion : `Plato ${detalle.PlatoID}`,
                            Precio: plato ? plato.Precio : 0
                        };
                    });
                }
            }

            const detallesMapeados = detallesConPlatos.map((d: any) => ({
                DetalleID: d.DetalleID,
                PlatoID: d.PlatoID,
                descripcionPlato: d.Descripcion,
                Cantidad: d.Cantidad,
                PrecioUnitario: Number(d.Precio) || 0,
                Impreso: !!d.Impreso
            }));

            setDetalles(detallesMapeados);
            setPedido({
                ...pedidoData,
                detalles: detallesMapeados,
                total: detallesMapeados.reduce((s, i) => s + i.Cantidad * i.PrecioUnitario, 0)
            });
        } catch (e: any) {
            setError(e.message || 'Error cargando pedido');
        } finally {
            setIsLoading(false);
        }
    }, [pedidoId]);

    useEffect(() => {
        fetchPedido();
    }, [fetchPedido]);

    const calcularTotal = (detalles: any[]) => {
        return detalles.reduce((acc: number, detalle: any) => acc + detalle.Cantidad * detalle.PrecioUnitario, 0);
    };

    const addPlatoToPedido = async (platoId: number, cantidad: number) => {
        setIsLoading(true);
        try {
            // Primero verificar si el plato ya existe en el pedido
            const platoExistente = pedido?.detalles.find((detalle: any) => detalle.PlatoID === platoId);

            if (platoExistente) {
                // Si existe, incrementar la cantidad
                const response = await fetch(`/api/detallepedidos/${platoExistente.DetalleID}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        operacion: "incrementar",
                        cantidad: cantidad, // Incrementar por la cantidad especificada
                    }),
                });
                if (!response.ok) {
                    throw new Error("Error al actualizar el plato en el pedido");
                }
            } else {
                // Si no existe, crear nuevo detalle
                const response = await fetch(`/api/detallepedidos`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        PedidoID: pedidoId,
                        PlatoID: platoId,
                        Cantidad: cantidad,
                    }),
                });
                if (!response.ok) {
                    throw new Error("Error al agregar el plato al pedido");
                }
            }

            // Actualizar el pedido para obtener los cambios
            await fetchPedido();
        } catch (error) {
            console.error(error);
            setError("Error al agregar el plato al pedido. Inténtalo de nuevo más tarde.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleIncrementarCantidad = async (detalleId: number) => {
        // Abrir modal de incrementar platos en lugar de incrementar directamente
        setIsModalIncrementarOpen(true);
    };

    // Función original para incrementar (usada internamente por el modal)
    const handleIncrementarCantidadOriginal = async (detalleId: number) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/detallepedidos/${detalleId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    operacion: "incrementar",
                }),
            });
            if (!response.ok) {
                throw new Error("Error al incrementar la cantidad del plato");
            }
            setPedido((prevPedido: any) => {
                const detallesActualizados = prevPedido.detalles.map((detalle: any) =>
                    detalle.DetalleID === detalleId
                        ? {
                            ...detalle,
                            Cantidad: detalle.Cantidad + 1,
                        }
                        : detalle,
                );
                return {
                    ...prevPedido,
                    detalles: detallesActualizados,
                    total: calcularTotal(detallesActualizados),
                };
            });
        } catch (error) {
            console.error(error);
            setError("Error al incrementar la cantidad del plato. Inténtalo de nuevo más tarde.");
        } finally {
            setIsLoading(false);
        }
    };

    // Función para manejar incrementos desde el modal
    const handleIncrementarFromModal = async (detalleId: number, cantidad: number) => {
        for (let i = 0; i < cantidad; i++) {
            await handleIncrementarCantidadOriginal(detalleId);
        }
    };

    // Función para imprimir comandas con los nuevos platos incrementados
    const handleImprimirNuevosIncrement = async (platosNuevos: any[], comentario: string) => {
        try {
            // Crear comentario para la comanda con los platos incrementados
            const platosTexto = platosNuevos.map(plato => 
                `${plato.Cantidad}x ${plato.Descripcion}`
            ).join(", ");
            
            const comentarioCompleto = `NUEVOS PLATOS - Solo: ${platosTexto}${comentario ? ` | ${comentario}` : ""}`;
            
            // Enviar comanda a cocina
            const comandaResponse = await fetch("/api/comanda-cocina", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pedidoID: pedidoId,
                    comentario: comentarioCompleto,
                }),
            });

            if (!comandaResponse.ok) {
                const error = await comandaResponse.json();
                throw new Error(error.message || "Error al crear la comanda");
            }

            const comanda = await comandaResponse.json();
            console.log(`✅ Comanda ${comanda.ComandaID} creada para incrementos del pedido ${pedidoId}`);
            
            // Refrescar datos del pedido
            await fetchPedido();
        } catch (error) {
            console.error("Error al imprimir comanda de incrementos:", error);
            throw error;
        }
    };

    const handleDecrementarCantidad = async (detalleId: number) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/detallepedidos/${detalleId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    operacion: "decrementar",
                }),
            });
            if (!response.ok) {
                throw new Error("Error al decrementar la cantidad del plato");
            }
            setPedido((prevPedido: any) => {
                const detallesActualizados = prevPedido.detalles.map((detalle: any) =>
                    detalle.DetalleID === detalleId ? { ...detalle, Cantidad: Math.max(detalle.Cantidad - 1, 1) } : detalle,
                );
                return {
                    ...prevPedido,
                    detalles: detallesActualizados,
                    total: calcularTotal(detallesActualizados),
                };
            });
        } catch (error) {
            console.error(error);
            setError("Error al decrementar la cantidad del plato. Inténtalo de nuevo más tarde.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEliminarPlato = async (detalleId: number) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/detallepedidos/${detalleId}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                throw new Error("Error al eliminar el plato del pedido");
            }
            setPedido((prevPedido: any) => {
                const detallesActualizados = prevPedido.detalles.filter((detalle: any) => detalle.DetalleID !== detalleId);
                return {
                    ...prevPedido,
                    detalles: detallesActualizados,
                    total: calcularTotal(detallesActualizados),
                };
            });
        } catch (error) {
            console.error(error);
            setError("Error al eliminar el plato del pedido. Inténtalo de nuevo más tarde.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoBack = () => {
        router.push("/empleado/para-llevar/lista");
    };

    const handleEliminarPedido = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/pedidos/${pedidoId}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                throw new Error("Error al eliminar el pedido");
            }
            setPedido(null);
            router.push("/empleado/para-llevar/lista");
        } catch (error) {
            console.error(error);
            setError("Error al eliminar el pedido. Inténtalo de nuevo más tarde.");
        } finally {
            setIsLoading(false);
        }
    };

    const procesarPago = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/pedidos/${pedidoId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...pedido,
                    Estado: false,
                    Fecha: new Date(),
                    TipoPago: tipoPago,
                }),
            });
            if (!response.ok) {
                throw new Error("Error al pagar el pedido");
            }
            router.push("/empleado/para-llevar/lista");
        } catch (error) {
            console.error(error);
            setError("Error al pagar el pedido. Inténtalo de nuevo más tarde.");
        } finally {
            setIsLoading(false);
            setIsConfirmDialogOpen(false);
        }
    };

    const handlePagarPedido = () => {
        if (!pedido || !tipoPago) {
            alert("Selecciona un tipo de pago");
            return;
        }

        if (tipoPago === 2) {
            setIsYapeDialogOpen(true);
            return;
        }

        setIsConfirmDialogOpen(true);
    };

    const buttonColor = (() => {
        switch (tipoPago) {
            case 1:
                return "bg-[#00631b] hover:bg-[#00631b]/90";
            case 2:
                return "bg-[#931194] hover:bg-[#931194]/90";
            case 3:
                return "bg-[#f7762c] hover:bg-[#f7762c]/90";
            default:
                return "";
        }
    })();

    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-4 lg:p-8">
            <div className="mx-auto max-w-7xl">
                <Card className="overflow-hidden shadow-xl border-0">
                    

                    <CardContent className="p-0">
                        <div className="flex flex-col xl:flex-row">
                            {/* Sidebar - Información de pedido y controles */}
                            <div className="w-full xl:w-1/3 p-4 sm:p-6 border-b xl:border-b-0 xl:border-r bg-gradient-to-b from-gray-50 to-white">
                                <div className="space-y-4 sm:space-y-6">
                                    {/* Información del pedido para llevar */}
                                    <Card className="shadow-md border-0 bg-white">
                                        <CardContent className="p-4 sm:p-6">
                                            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4 text-gray-800">
                                                Pedido Para Llevar
                                            </h2>
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                                <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full w-fit shadow-sm">
                                                    Para Llevar
                                                </span>
                                                <div className="text-sm text-muted-foreground font-medium">Moz@: {empleado?.Nombre}</div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Controles */}
                                    <div className="space-y-3 sm:space-y-4">
                                        <MesaOcupadaAgregar
                                            addPlatoToPedido={addPlatoToPedido}
                                            pedido={pedido}
                                            onPedidoUpdated={fetchPedido}
                                        />

                                        <Button
                                            onClick={() => setIsModalIncrementarOpen(true)}
                                            disabled={!pedido || pedido.detalles.length === 0}
                                            className="w-full text-sm sm:text-base transition-all duration-300 ease-in-out transform hover:scale-105 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg"
                                        >
                                            <Plus className="w-4 h-4 mr-2" /> Agregar Más Platos
                                        </Button>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="destructive"
                                                    className="w-full text-sm sm:text-base transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg"
                                                >
                                                    <X className="w-4 h-4 mr-2" /> Cancelar Pedido
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Cancelar pedido?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción eliminará el pedido para llevar y todos sus platos asociados. ¿Estás seguro que deseas
                                                        continuar?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Volver</AlertDialogCancel>
                                                    <AlertDialogAction asChild>
                                                        <Button variant="destructive" onClick={handleEliminarPedido}>
                                                            Sí, cancelar pedido
                                                        </Button>
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>

                                        {pedido && (
                                            <div className="flex flex-col gap-2">
                                                <BoletaCocinaModal
                                                    mode="reimprimir"
                                                    pedidoId={pedidoId}
                                                    mesas={[{ NumeroMesa: 0 }]}
                                                    orderItems={pedido.detalles.map((detalle: any) => ({
                                                        DetalleID: detalle.DetalleID,
                                                        PlatoID: detalle.PlatoID,
                                                        Descripcion: detalle.descripcionPlato,
                                                        Cantidad: detalle.Cantidad,
                                                    }))}
                                                    onPrintSuccess={() => {
                                                        fetchPedido();
                                                    }}
                                                    triggerButton={
                                                        <Button
                                                            className="w-full text-sm sm:text-base transition-all duration-300 ease-in-out transform hover:scale-105 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg"
                                                            disabled={!pedido}
                                                        >
                                                            <Printer className="w-4 h-4 mr-2" /> Reimprimir Todo el Pedido
                                                        </Button>
                                                    }
                                                />
                                            </div>
                                        )}

                                        <Button
                                            variant="link"
                                            className="w-full text-brandSecondary hover:text-brandSecondary/80 transition-colors text-sm sm:text-base hidden md:block"
                                            onClick={handleGoBack}
                                        >
                                            ← Volver
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Contenido principal - Pedido */}
                            <div className="w-full xl:w-2/3 p-4 sm:p-6 bg-white">
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">Pedido:</h2>
                                        {pedido && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                                    {pedido.detalles.length} platos
                                                </span>
                                                <span className="font-semibold text-gray-800">Total: S/. {pedido.total.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {isLoading ? (
                                        <div className="text-center py-12">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brandSecondary mx-auto mb-4"></div>
                                            <p className="text-gray-500">Cargando pedido...</p>
                                        </div>
                                    ) : error ? (
                                        <div className="text-center py-12">
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                                <p className="text-red-600 text-sm sm:text-base">{error}</p>
                                            </div>
                                        </div>
                                    ) : pedido ? (
                                        <>
                                            {/* Tabla para pantallas medianas y grandes */}
                                            <div className="hidden md:block overflow-x-auto">
                                                <Card className="shadow-sm">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="bg-gray-50">
                                                                <TableHead className="whitespace-nowrap font-semibold">Plato</TableHead>
                                                                <TableHead className="whitespace-nowrap font-semibold">Cant.</TableHead>
                                                                <TableHead className="whitespace-nowrap font-semibold">Precio U.</TableHead>
                                                                <TableHead className="whitespace-nowrap font-semibold">Precio T.</TableHead>
                                                                <TableHead className="whitespace-nowrap font-semibold">Acciones</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {pedido.detalles.map((detalle: any) => (
                                                                <TableRow key={detalle.DetalleID} className="hover:bg-gray-50 transition-colors">
                                                                    <TableCell className="font-medium">{detalle.descripcionPlato}</TableCell>
                                                                    <TableCell className="text-center">{detalle.Cantidad}</TableCell>
                                                                    <TableCell>S/. {detalle.PrecioUnitario.toFixed(2)}</TableCell>
                                                                    <TableCell className="font-semibold">
                                                                        S/. {(detalle.Cantidad * detalle.PrecioUnitario).toFixed(2)}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div className="flex items-center gap-2">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => handleDecrementarCantidad(detalle.DetalleID)}
                                                                                className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200"
                                                                            >
                                                                                <Minus className="h-4 w-4" />
                                                                            </Button>
                                                                            <AlertDialog>
                                                                                <AlertDialogTrigger asChild>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="destructive"
                                                                                        className="h-8 w-8 p-0"
                                                                                    >
                                                                                        <Trash className="h-4 w-4" />
                                                                                    </Button>
                                                                                </AlertDialogTrigger>
                                                                                <AlertDialogContent>
                                                                                    <AlertDialogHeader>
                                                                                        <AlertDialogTitle>¿Eliminar plato?</AlertDialogTitle>
                                                                                        <AlertDialogDescription>
                                                                                            ¿Estás seguro que deseas eliminar &quot;{detalle.descripcionPlato}&quot; del pedido?
                                                                                        </AlertDialogDescription>
                                                                                    </AlertDialogHeader>
                                                                                    <AlertDialogFooter>
                                                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                                        <AlertDialogAction asChild>
                                                                                            <Button variant="destructive" onClick={() => handleEliminarPlato(detalle.DetalleID)}>
                                                                                                Eliminar
                                                                                            </Button>
                                                                                        </AlertDialogAction>
                                                                                    </AlertDialogFooter>
                                                                                </AlertDialogContent>
                                                                            </AlertDialog>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </Card>
                                            </div>

                                            {/* Vista móvil */}
                                            <div className="md:hidden">
                                                <Collapsible open={isPlatosOpen} onOpenChange={setIsPlatosOpen}>
                                                    <CollapsibleTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="w-full justify-between p-4 h-auto bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all duration-200"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-brandSecondary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                                                                    {pedido.detalles.length}
                                                                </div>
                                                                <span className="font-semibold text-gray-700">
                                                                    Ver platos del pedido
                                                                </span>
                                                            </div>
                                                            {isPlatosOpen ? (
                                                                <ChevronUp className="h-5 w-5 text-gray-600" />
                                                            ) : (
                                                                <ChevronDown className="h-5 w-5 text-gray-600" />
                                                            )}
                                                        </Button>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent className="space-y-3 mt-3">
                                                        {pedido.detalles.map((detalle: any) => (
                                                            <Card key={detalle.DetalleID} className="shadow-sm border-l-4 border-l-brandSecondary">
                                                                <CardContent className="p-4">
                                                                    <div className="flex justify-between items-start mb-3">
                                                                        <div className="flex-1">
                                                                            <h3 className="font-semibold text-gray-800 mb-1">{detalle.descripcionPlato}</h3>
                                                                            <p className="text-sm text-gray-600">
                                                                                S/. {detalle.PrecioUnitario.toFixed(2)} c/u
                                                                            </p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="font-bold text-lg text-brandSecondary">
                                                                                S/. {(detalle.Cantidad * detalle.PrecioUnitario).toFixed(2)}
                                                                            </p>
                                                                            <p className="text-sm text-gray-500">Cantidad: {detalle.Cantidad}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex justify-center gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => handleDecrementarCantidad(detalle.DetalleID)}
                                                                            className="flex-1 hover:bg-red-50 hover:border-red-200"
                                                                        >
                                                                            <Minus className="h-4 w-4 mr-1" />
                                                                            Reducir
                                                                        </Button>
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="destructive"
                                                                                    className="flex-1"
                                                                                >
                                                                                    <Trash className="h-4 w-4 mr-1" />
                                                                                    Eliminar
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>¿Eliminar plato?</AlertDialogTitle>
                                                                                    <AlertDialogDescription>
                                                                                        ¿Estás seguro que deseas eliminar &quot;{detalle.descripcionPlato}&quot; del pedido?
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                                    <AlertDialogAction asChild>
                                                                                        <Button variant="destructive" onClick={() => handleEliminarPlato(detalle.DetalleID)}>
                                                                                            Eliminar
                                                                                        </Button>
                                                                                    </AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            </div>

                                            {/* Total y pago */}
                                            <Card className="shadow-lg border-0 bg-gradient-to-r from-gray-50 to-white">
                                                <CardContent className="p-4 sm:p-6">
                                                    <div className="space-y-4">
                                                        <div className="text-center sm:text-left">
                                                            <span className="text-2xl sm:text-3xl font-bold text-gray-800 bg-gradient-to-r from-brandSecondary to-brandSecondary/80 bg-clip-text text-transparent">
                                                                Total: S/. {pedido.total.toFixed(2)}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-end">
                                                            <Select
                                                                onValueChange={(value) => setTipoPago(Number(value))}
                                                                value={tipoPago?.toString() || ""}
                                                            >
                                                                <SelectTrigger className="w-full sm:w-48 h-12 border-2 hover:border-brandSecondary transition-colors">
                                                                    <SelectValue placeholder="Seleccionar tipo de pago" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="1">💵 Efectivo</SelectItem>
                                                                    <SelectItem value="2">📱 Yape</SelectItem>
                                                                    <SelectItem value="3">💳 POS</SelectItem>
                                                                </SelectContent>
                                                            </Select>

                                                            {/* Diálogo para Yape */}
                                                            <AlertDialog open={isYapeDialogOpen} onOpenChange={setIsYapeDialogOpen}>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Pago con Yape</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Monto a cobrar: S/. {pedido?.total.toFixed(2)}
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <div className="flex justify-center py-4">
                                                                        <div className="bg-gray-100 p-4 rounded-lg">
                                                                            <p className="text-center text-sm text-gray-600 mb-2">
                                                                                Código QR para Yape
                                                                            </p>
                                                                            <div className="w-48 h-48 bg-white border-2 border-dashed border-gray-300 flex items-center justify-center">
                                                                                <span className="text-gray-400">QR Code</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={procesarPago}>
                                                                            Confirmar Pago
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>

                                                            {/* Diálogo de confirmación */}
                                                            <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Confirmar Pago</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            ¿Estás seguro de procesar el pago de S/. {pedido?.total.toFixed(2)}?
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={procesarPago}>
                                                                            Confirmar
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>

                                                            <Button
                                                                onClick={handlePagarPedido}
                                                                disabled={!tipoPago}
                                                                className={`w-full sm:w-auto h-12 px-8 ${buttonColor} transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold`}
                                                            >
                                                                <Check className="w-5 h-5 mr-2" />
                                                                Pagar Pedido
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8">
                                                <p className="text-gray-500 text-sm sm:text-base">
                                                    No se encontró el pedido para llevar.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modal para incrementar platos */}
            <ModalIncrementarPlatos
                isOpen={isModalIncrementarOpen}
                onClose={() => setIsModalIncrementarOpen(false)}
                pedido={pedido}
                onPlatoIncrement={handleIncrementarFromModal}
                onImprimirNuevos={handleImprimirNuevosIncrement}
            />
        </div>
    );
}
