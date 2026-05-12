import { PedidoEstado, pedidos } from "@prisma/client";

export const pagarPedido = async (pedido: pedidos) => {
  const response = await fetch(`/api/pedidos/${pedido.PedidoID}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Estado: PedidoEstado.Cerrado,
      TipoPago: pedido.TipoPago,
    }),
  });

  if (!response.ok) {
    throw new Error("Error al pagar el pedido");
  }
};
