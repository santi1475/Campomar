"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEmpleadoStore } from "@/store/empleado";
import { empleados, mesas } from "@prisma/client";
import { X, PlusIcon, MinusIcon, Trash2, Printer } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MesaOcupadaAgregar } from "./Modal/MesaOcupadaAgregar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BoletaTotal from "../boleta/BoletaTotal";
import BoletaCocinaImprimir from "@/components/trabajadores/boleta/BoletaCocinaPrint"; // Ensure this file exists at the specified path or update the path to the correct location.

export const MesaOcupada = () => {
  const empleado: empleados = useEmpleadoStore((state: any) => state.empleado);
  const router = useRouter();
  const searchParams = useSearchParams();
  const mesasParam = searchParams.get("mesas");

  const [selectedTables, setSelectedTables] = useState<mesas[]>([]);
  const [pedido, setPedido] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tipoPago, setTipoPago] = useState<number | null>(null);
  const [comentarioCocina, setComentarioCocina] = useState("");
  const [showComentarioInput, setShowComentarioInput] = useState(false);

  // Llamada a la API para obtener el pedido relacionado con esas mesas
  const fetchPedido = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pedido_mesas?mesas=${mesasParam}`);
      if (!response.ok) {
        throw new Error("Error al obtener el pedido");
      }

      const data = await response.json();
      if (!data || !data.detalles || data.detalles.length === 0) {
        setPedido(null); // No hay pedido activo
      } else {
        setPedido(data); // Pedido encontrado
      }
    } catch (error) {
      console.error(error);
      setError("Error al obtener el pedido. Inténtalo de nuevo más tarde.");
    } finally {
      setIsLoading(false);
    }
  }, [mesasParam]);

  useEffect(() => {
    if (mesasParam) {
      const mesasArray = mesasParam.split(",").map(Number);
      const fetchMesas = async () => {
        const promises = mesasArray.map((mesaId) =>
          fetch(`/api/mesas/${mesaId}`).then((res) => res.json())
        );

        const mesas = await Promise.all(promises);
        setSelectedTables(mesas);
      };

      fetchPedido();
      fetchMesas();
    }
  }, [fetchPedido, mesasParam]);

  const calcularTotal = (detalles: any[]) => {
    return detalles.reduce(
      (acc: number, detalle: any) =>
        acc + detalle.Cantidad * detalle.PrecioUnitario,
      0
    );
  };

  const addPlatoToPedido = async (platoId: number, cantidad: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/detallepedidos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          PedidoID: pedido.PedidoID,
          PlatoID: platoId,
          Cantidad: cantidad,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al agregar el plato al pedido");
      }

      await fetchPedido();
    } catch (error) {
      console.error(error);
      setError(
        "Error al agregar el plato al pedido. Inténtalo de nuevo más tarde."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncrementarCantidad = async (detalleId: number) => {
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

      const data = await response.json();
      setPedido((prevPedido: any) => {
        const detallesActualizados = prevPedido.detalles.map((detalle: any) =>
          detalle.DetalleID === detalleId
            ? {
                ...detalle,
                Cantidad: detalle.Cantidad + 1,
              }
            : detalle
        );
        return {
          ...prevPedido,
          detalles: detallesActualizados,
          total: calcularTotal(detallesActualizados),
        };
      });
    } catch (error) {
      console.error(error);
      setError(
        "Error al incrementar la cantidad del plato. Inténtalo de nuevo más tarde."
      );
    } finally {
      setIsLoading(false);
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
          detalle.DetalleID === detalleId
            ? { ...detalle, Cantidad: Math.max(detalle.Cantidad - 1, 1) }
            : detalle
        );
        return {
          ...prevPedido,
          detalles: detallesActualizados,
          total: calcularTotal(detallesActualizados),
        };
      });
    } catch (error) {
      console.error(error);
      setError(
        "Error al decrementar la cantidad del plato. Inténtalo de nuevo más tarde."
      );
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
        const detallesActualizados = prevPedido.detalles.filter(
          (detalle: any) => detalle.DetalleID !== detalleId
        );
        return {
          ...prevPedido,
          detalles: detallesActualizados,
          total: calcularTotal(detallesActualizados),
        };
      });
    } catch (error) {
      console.error(error);
      setError(
        "Error al eliminar el plato del pedido. Inténtalo de nuevo más tarde."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleEliminarPedido = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/pedidos/${pedido.PedidoID}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el pedido");
      }

      setPedido(null);
      router.back();
    } catch (error) {
      console.error(error);
      setError("Error al eliminar el pedido. Inténtalo de nuevo más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePagarPedido = async () => {
    if (!pedido || !tipoPago) {
      alert("Selecciona un tipo de pago");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/pedidos/${pedido.PedidoID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...pedido,
          Estado: 0,
          Fecha: new Date(),
          TipoPago: tipoPago,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al pagar el pedido");
      }

      router.push("/empleado/sala");
    } catch (error) {
      console.error(error);
      setError("Error al pagar el pedido. Inténtalo de nuevo más tarde.");
    } finally {
      setIsLoading(false);
    }
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <header className="bg-brandSecondary text-primary-foreground p-6">
          <h1 className="text-3xl font-bold">Modificar pedido</h1>
        </header>
        <div className="flex flex-col lg:flex-row p-6 gap-8">
          <div className="w-full lg:w-1/3 space-y-6">
            <div className="bg-secondary p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">
                Mesa(s){" "}
                {selectedTables.map((mesa) => mesa.NumeroMesa).join(", ")}
              </h2>
              <div className="flex justify-between items-center">
                <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded">
                  Ocupado
                </span>
              </div>
              <div className="mt-2 text-muted-foreground">
                Moz@: {empleado.Nombre}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <MesaOcupadaAgregar
                addPlatoToPedido={addPlatoToPedido}
                pedido={pedido}
              />
              <Button
                variant="destructive"
                className="w-full transition duration-200 ease-in-out transform hover:scale-105"
                onClick={handleEliminarPedido}
              >
                <X className="w-4 h-4 mr-2" /> Cancelar Pedido
              </Button>
              <BoletaCocinaImprimir
                mesas={selectedTables}
                orderItems={
                  pedido?.detalles.map((detalle: any) => ({
                    PlatoID: detalle.PlatoID,
                    Descripcion: detalle.descripcionPlato,
                    Cantidad: detalle.Cantidad,
                  })) || []
                }
                comentario={comentarioCocina}
                triggerButton={
                  <Button
                    className="w-full transition duration-200 ease-in-out transform hover:scale-105 bg-blue-600"
                    disabled={!pedido || pedido.detalles.length === 0}
                  >
                    <Printer className="w-4 h-4 mr-2" /> Imprimir Boleta
                  </Button>
                }
              />
              {/* Botón para mostrar input de comentario */}
              {!showComentarioInput ? (
                <Button
                  variant="secondary"
                  onClick={() => setShowComentarioInput(true)}
                >
                  Agregar instrucción para cocina
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <textarea
                    className="border rounded p-2 w-full"
                    rows={2}
                    placeholder="Escribe una instrucción para la cocina..."
                    value={comentarioCocina}
                    onChange={(e) => setComentarioCocina(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setComentarioCocina("");
                        setShowComentarioInput(false);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowComentarioInput(false)}
                      disabled={comentarioCocina.trim() === ""}
                    >
                      Guardar instrucción
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="link"
              className="w-full text-brandSecondary hover:text-brandSecondary/80 transition-colors"
              onClick={handleGoBack}
            >
              ← Volver
            </Button>
          </div>
          <div className="w-full lg:w-2/3 space-y-6">
            <h2 className="text-2xl font-semibold">Pedido:</h2>

            {isLoading ? (
              <p className="text-center text-gray-500">Cargando pedido...</p>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : pedido ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">
                          Plato
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          Cant.
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          Precio U.
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          Precio T.
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pedido.detalles.map((detalle: any) => (
                        <TableRow key={detalle.PlatoID}>
                          <TableCell>{detalle.descripcionPlato}</TableCell>
                          <TableCell>{detalle.Cantidad}</TableCell>
                          <TableCell>
                            S/. {Number(detalle.PrecioUnitario).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            S/.{" "}
                            {(
                              detalle.Cantidad * detalle.PrecioUnitario
                            ).toFixed(2)}
                          </TableCell>
                          <TableCell className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDecrementarCantidad(detalle.DetalleID)
                              }
                              className="p-2 hover:bg-gray-100"
                            >
                              <MinusIcon size={16} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleIncrementarCantidad(detalle.DetalleID)
                              }
                              className="p-2 hover:bg-gray-100"
                            >
                              <PlusIcon size={16} />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handleEliminarPlato(detalle.DetalleID)
                              }
                              className="p-2 hover:bg-red-600"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <span className="text-xl font-semibold">
                    Total: S/. {pedido.total.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-4">
                    <Select
                      onValueChange={(value) => setTipoPago(Number(value))}
                      value={tipoPago?.toString() || ""}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Pago" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Efectivo</SelectItem>
                        <SelectItem value="2">Yape</SelectItem>
                        <SelectItem value="3">POS</SelectItem>
                      </SelectContent>
                    </Select>

                    <BoletaTotal
                      pedidoID={pedido.PedidoID}
                      onFinishOrder={handlePagarPedido}
                      buttonColor={buttonColor}
                      tipoPago={tipoPago}
                    />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500">
                No se encontró ningún pedido activo para estas mesas.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
