import { ListaPlatos } from "@/components/trabajadores/carta/ListaPlatos";
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
