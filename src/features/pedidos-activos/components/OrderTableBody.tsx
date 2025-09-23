"use client";

import { useEffect, useState } from "react";
import OrderRow from "./OrderRow";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const OrderTableBody = ({
  searchTerm,
  refreshKey,
  onDataMutation,
}: {
  searchTerm: string;
  refreshKey: number;
  onDataMutation: () => void;
}) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [tipoPago, setTipoPago] = useState<Record<number, number | null>>({});

  const handleTipoPagoChange = (orderId: number, value: number | null) => {
    setTipoPago((prev) => ({
      ...prev,
      [orderId]: value,
    }));
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        console.log('Cliente: Iniciando fetch de pedidos');
        const response = await fetch("/api/pedido-platos", { cache: "no-store" });
        const data = await response.json();
        
        console.log('Cliente: Respuesta del servidor:', data);

        if (response.ok && data.success) {
          console.log('Cliente: Pedidos obtenidos correctamente:', {
            totalPedidos: data.debug?.totalPedidos,
            pedidosActivos: data.debug?.pedidosActivos,
            pedidosConDetalles: data.debug?.pedidosConDetalles
          });
          setOrders(data.data);
        } else {
          console.error("Cliente: Error al cargar pedidos:", data.error, data.errorDetails);
          setError(data.errorDetails || data.error || "Error al cargar los pedidos");
        }
      } catch (error) {
        console.error("Cliente: Error al hacer fetch:", error);
        setError(error instanceof Error ? error.message : "Error al cargar los pedidos");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [refreshKey]);

  const handleFinishOrder = async (orderId: number) => {
    try {
      setLoading(true);
      console.log('Cliente: Iniciando finalización del pedido:', orderId);
      
  const response = await fetch(`/api/pedidos/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Estado: false,
          Fecha: new Date(),
          TipoPago: tipoPago[orderId],
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Cliente: Pedido finalizado exitosamente:', data);
        
        // Recargar los pedidos inmediatamente después de finalizar uno
    const updatedResponse = await fetch("/api/pedido-platos", { cache: "no-store" });
        const updatedData = await updatedResponse.json();
        
        if (updatedResponse.ok && updatedData.success) {
          console.log('Cliente: Actualizando lista de pedidos después del pago');
          setOrders(updatedData.data);
        }
        
        setTipoPago((prev) => {
          const updated = { ...prev };
          delete updated[orderId];
          return updated;
        });
        
        onDataMutation();
      } else {
        console.error("Cliente: Error al finalizar pedido:", data.error || "Error desconocido");
        setError(data.error || "Error al finalizar el pedido");
      }
    } catch (error) {
      console.error("Cliente: Error al finalizar pedido:", error);
      setError(error instanceof Error ? error.message : "Error al finalizar el pedido");
    } finally {
      setLoading(false);
    }
  };

  console.log('Cliente: Pedidos recibidos del backend:', orders);
  const filteredOrders = orders.filter((order) => {
    const isActive = order.Estado === true;
    if (!isActive) {
      console.log(`Cliente: Pedido ${order.PedidoID} filtrado por Estado FALSE`);
    }
    return isActive;
  });
  console.log('Cliente: Pedidos después de filtrar por Estado:', filteredOrders);

  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={6} className="h-24 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          <span className="sr-only">Cargando pedidos...</span>
        </TableCell>
      </TableRow>
    );
  }
  
  if (error) {
    return (
      <TableRow>
        <TableCell colSpan={6} className="h-24 text-center text-red-600">
          <div className="flex flex-col items-center gap-2">
            <span>Error: {error}</span>
            <Button variant="outline" onClick={() => {
              setError(null);
              setLoading(true);
              const fetchOrders = async () => {
                try {
                  const response = await fetch("/api/pedido-platos");
                  const data = await response.json();
                  if (response.ok && data.success) {
                    setOrders(data.data);
                  } else {
                    setError(data.errorDetails || data.error || "Error al cargar los pedidos");
                  }
                } catch (error) {
                  setError(error instanceof Error ? error.message : "Error al cargar los pedidos");
                } finally {
                  setLoading(false);
                }
              };
              fetchOrders();
            }}>
              Reintentar
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {filteredOrders.map((order) => (
        <OrderRow
          key={order.PedidoID}
          order={{
            id: order.PedidoID,
            table: order.pedido_mesas
              .map((mesa: any) => mesa.mesas.NumeroMesa)
              .join(", "),
            items: order.detallepedidos.length,
            total: order.Total,
            time: new Date(order.Fecha).toLocaleTimeString().slice(0, 5),
            date: new Date(order.Fecha).toLocaleDateString(),
          }}
          onFinishOrder={() => handleFinishOrder(order.PedidoID)}
          onViewOrder={() => setSelectedOrder(order)}
          onTipoPagoChange={(value) =>
            handleTipoPagoChange(order.PedidoID, value)
          }
          tipoPago={tipoPago[order.PedidoID] || null}
        />
      ))}

      {/* Modal */}
      {selectedOrder && (
        <Dialog
          open={!!selectedOrder}
          onOpenChange={() => setSelectedOrder(null)}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Detalles del Pedido</DialogTitle>
              <DialogDescription>
                Pedido ID: {selectedOrder.PedidoID}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {selectedOrder.detallepedidos.map((detalle: any) => (
                <div
                  key={detalle.DetalleID}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <span className="font-medium">
                    {detalle.platos.Descripcion}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {detalle.Cantidad}x
                  </span>
                  <span className="font-semibold">
                    S/. {(detalle.platos.Precio * detalle.Cantidad).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={() => setSelectedOrder(null)}>Cerrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default OrderTableBody;
