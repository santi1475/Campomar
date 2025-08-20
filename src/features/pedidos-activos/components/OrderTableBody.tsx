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
        const response = await fetch("/api/pedido-platos");
        const data = await response.json();
        console.log(data.data);

        if (response.ok) {
          setOrders(data.data);
        } else {
          console.error("Error al cargar pedidos:", data.error);
        }
      } catch (error) {
        console.error("Error al hacer fetch:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [refreshKey]);

  const handleFinishOrder = async (orderId: number) => {
    try {
      const response = await fetch(`/api/pedidos/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Estado: 0,
          Fecha: new Date(),
          TipoPago: tipoPago[orderId],
        }),
      });

      if (response.ok) {
        // Notificar al padre para refrescar los datos
        onDataMutation();
        
        // Limpiar el tipo de pago del pedido finalizado
        setTipoPago((prev) => {
          const updated = { ...prev };
          delete updated[orderId];
          return updated;
        });
      } else {
        console.error("Error al finalizar pedido.");
      }
    } catch (error) {
      console.error("Error al finalizar pedido:", error);
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.Estado && // Solo mostrar pedidos activos
      order.pedido_mesas.some((pedidoMesa: any) =>
        pedidoMesa.mesas.NumeroMesa.toString().includes(searchTerm)
      )
  );

  if (loading)
    return (
      <TableRow>
        <TableCell colSpan={6} className="h-24 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          <span className="sr-only">Cargando pedidos...</span>
        </TableCell>
      </TableRow>
    );

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
