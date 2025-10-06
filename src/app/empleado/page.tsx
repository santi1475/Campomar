"use client";

import { CardEmpleado } from "@/components/shared/ui/CardNavegacion";
import { useEmpleadoStore } from "@/store/empleado";
import { empleados } from "@prisma/client";
import { Armchair, BookOpen, HandPlatter, ShoppingBag } from "lucide-react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

const EmpleadoPage = () => {
  const empleado = useEmpleadoStore(
    (state: any) => state.empleado
  ) as empleados | null;

  const setEmpleado = useEmpleadoStore((state: any) => state.setEmpleado);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmpleado = localStorage.getItem("empleado");
      if (storedEmpleado && !empleado) {
        setEmpleado(JSON.parse(storedEmpleado));
      } else if (!storedEmpleado || empleado?.TipoEmpleadoID === 2) {
        redirect("/login");
      }
      setLoading(false);
    }
  }, [empleado, setEmpleado]);

  if (loading && !empleado) {
    return <div>Cargando...</div>;
  }

  if (!empleado) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto">
      <div className="flex flex-col sm:flex-row gap-1 md:gap-2 justify-center items-center w-full">
        <CardEmpleado
          texto="Ver Sala"
          icono={<Armchair size={60} />}
          direccion="/empleado/sala"
        />
        <CardEmpleado
          texto="Para Llevar"
          icono={<ShoppingBag size={60} />}
          direccion="/empleado/para-llevar/lista"
        />
      </div>
    </div>
  );
};

export default EmpleadoPage;
