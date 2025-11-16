"use client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GestionMesas } from "@/features/gestion-mesas/components/PanelGestionMesas";
import { GestionEmpleados } from "@/features/gestion-empleados/components/PanelGestionEmpleados";
import { GestionPlatos } from "@/features/gestion-platos/components/PanelGestionPlatos";
import { DashboardSummary } from "@/features/dashboard/components/AdminDashboard";
import dynamic from "next/dynamic";
import { AdminHeader } from "@/components/shared/layout/AdminHeader";
import { useEmpleadoStore } from "@/store/empleado";
import { useEffect, useState } from "react";
import { empleados } from "@prisma/client";
import { redirect } from 'next/navigation';
import { CarruselPedidos } from "@/features/dashboard/components/CarruselPedidos";

export default function AdminPage() {
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
      } else if (!storedEmpleado || empleado?.TipoEmpleadoID === 1) {
        redirect("/login");
      }
      setLoading(false);
    }
  }, [empleado, setEmpleado]);

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader />

      <main className="container mx-auto px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4 md:py-6">
        <Tabs defaultValue="tables" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 sm:gap-2 mb-4 sm:mb-6 p-1 sm:p-2">
            <TabsTrigger
              value="tables"
              className="text-xs sm:text-sm bg-white shadow-sm hover:bg-gray-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white px-2 sm:px-3 py-2 sm:py-3"
            >
              Mesas
            </TabsTrigger>

            <TabsTrigger
              value="colas-pedidos"
              className="text-xs sm:text-sm bg-white shadow-sm hover:bg-gray-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white px-2 sm:px-3 py-2 sm:py-3"
            >
              Cola
            </TabsTrigger>

            <TabsTrigger
              value="dishes"
              className="text-xs sm:text-sm bg-white shadow-sm hover:bg-gray-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white px-2 sm:px-3 py-2 sm:py-3"
            >
              Platos
            </TabsTrigger>
            <TabsTrigger
              value="employees"
              className="text-xs sm:text-sm bg-white shadow-sm hover:bg-gray-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white px-2 sm:px-3 py-2 sm:py-3"
            >
              Empleados
            </TabsTrigger>
            <TabsTrigger
              value="dashboard-summary"
              className="text-xs sm:text-sm bg-white shadow-sm hover:bg-gray-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white px-2 sm:px-3 py-2 sm:py-3"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="historial-pagos"
              className="text-xs sm:text-sm bg-white shadow-sm hover:bg-gray-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white px-2 sm:px-3 py-2 sm:py-3"
            >
              Historial
            </TabsTrigger>
          </TabsList>

          <div className="bg-white shadow rounded-lg p-2 sm:p-4 md:p-6 lg:p-8">
            <TabsContent value="tables" className="mt-0">
              <GestionMesas />
            </TabsContent>

            <TabsContent value="colas-pedidos" className="mt-0">
              <CarruselPedidos />
            </TabsContent>

            <TabsContent value="dishes" className="mt-0">
              <GestionPlatos />
            </TabsContent>

            <TabsContent value="employees" className="mt-0">
              <GestionEmpleados />
            </TabsContent>

            <TabsContent value="dashboard-summary" className="mt-0">
              <DashboardSummary />
            </TabsContent>
            <TabsContent value="historial-pagos" className="mt-0">
              {/* Carga diferida del historial para no impactar el bundle inicial */}
              <HistorialPagosLoader />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}

// Dynamic import para evitar cargarlo en el primer paint
const HistorialPagosLoader = dynamic(() => import("@/app/admin/historial-pagos/page"), {
  ssr: false,
  loading: () => (
    <div className="py-10 text-center text-sm text-gray-500">Cargando historial...</div>
  ),
});
