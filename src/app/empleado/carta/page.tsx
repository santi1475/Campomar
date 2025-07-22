import { ListaPlatos } from "@/features/crear-pedido/components/MenuPlatos";
import { platos } from "@prisma/client";
import React from "react";

const CartaPage = () => {
  return (
    <div>
      <ListaPlatos />
    </div>
  );
};

export default CartaPage;
