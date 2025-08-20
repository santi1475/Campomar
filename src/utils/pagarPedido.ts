import { pedidos } from "@prisma/client";

export const pagarPedido = async (pedido: pedidos) => {
  const response = await fetch(`/api/pedidos/${pedido.PedidoID}`, {
    method: "PUT",
    body: JSON.stringify({
      ...pedido,
      Estado: false,
    }),
  });

  if (!response.ok) {
    throw new Error("Error al pagar el pedido");
  }
};
