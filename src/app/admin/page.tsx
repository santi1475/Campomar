"use client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GestionMesas } from "@/features/gestion-mesas/components/PanelGestionMesas";
// Update the import path below to the correct location if different
// Update the import path below to the correct location if different
import { GestionEmpleados } from "@/features/gestion-empleados/components/PanelGestionEmpleados";
import { GestionPlatos } from "@/features/gestion-platos/components/PanelGestionPlatos";
import { DashboardSummary } from "@/features/dashboard/components/AdminDashboard";
import { AdminHeader } from "@/components/shared/layout/AdminHeader";
import { useEmpleadoStore } from "@/store/empleado";
import { useEffect, useState } from "react";
import { empleados } from "@prisma/client";
import { redirect } from "next/navigation";

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

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="tables" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <TabsTrigger
              value="tables"
              className="bg-white shadow-sm hover:bg-gray-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Mesas
            </TabsTrigger>
            <TabsTrigger
              value="dishes"
              className="bg-white shadow-sm hover:bg-gray-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Platos
            </TabsTrigger>
            <TabsTrigger
              value="employees"
              className="bg-white shadow-sm hover:bg-gray-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Empleados
            </TabsTrigger>
            <TabsTrigger
              value="dashboard-summary"
              className="bg-white shadow-sm hover:bg-gray-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Dashboard
            </TabsTrigger>
          </TabsList>

          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <TabsContent value="tables">
              <GestionMesas />
            </TabsContent>

            <TabsContent value="dishes">
              <GestionPlatos />
            </TabsContent>

            <TabsContent value="employees">
              <GestionEmpleados />
            </TabsContent>

            <TabsContent value="dashboard-summary">
              <DashboardSummary />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
