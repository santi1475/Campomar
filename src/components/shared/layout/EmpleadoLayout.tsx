"use client";

import { useEffect, useState } from "react";
import { useEmpleadoStore } from "@/store/empleado";
import { redirect } from "next/navigation";

const EmpleadoLayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const empleado = useEmpleadoStore((state: any) => state.empleado);
  const setEmpleado = useEmpleadoStore((state: any) => state.setEmpleado);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedEmpleado = localStorage.getItem("empleado");
    if (storedEmpleado && !empleado) {
      setEmpleado(JSON.parse(storedEmpleado));
    } else if (!storedEmpleado) {
      redirect("/login");
    }
    setLoading(false);
  }, [empleado, setEmpleado]);

  if (loading) {
    return null; // O un spinner de carga
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      {children}
    </div>
  );
};

export default EmpleadoLayoutWrapper;
