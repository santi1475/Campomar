"use client";

import { CardEmpleado } from "@/components/shared/ui/CardNavegacion";
import { useEmpleadoStore } from "@/store/empleado";
import { empleados } from "@prisma/client";
import { Armchair, BookOpen, HandPlatter } from "lucide-react";
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
      <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center w-full">
        <CardEmpleado
          texto="Ver Sala"
          icono={<Armchair size={60} />}
          direccion="/empleado/sala"
        />
        <CardEmpleado
          texto="Ver Carta"
          icono={<BookOpen size={60} />}
          direccion="/empleado/carta"
        />
        <CardEmpleado
          texto="Pedidos"
          icono={<HandPlatter size={60} />}
          direccion="/empleado/pedidos"
        />
      </div>
    </div>
  );
};

export default EmpleadoPage;
