"use client";

import React, { useCallback, useEffect, useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/shared/ui/spinner";
import {
  fetchEarnings,
  fetchSalesByEmployee,
  fetchTopSellingDishes,
} from "@/features/dashboard/services/dashboardUtils";

// Agrega nuevos estados para las ventas por empleado
export const DashboardSummary = () => {
  const [earnings, setEarnings] = useState<number>(0);
  const [earningsByPaymentType, setEarningsByPaymentType] = useState<{
    efectivo: number;
    yape: number;
    pos: number;
  }>({ efectivo: 0, yape: 0, pos: 0 }); // Estado para ganancias por tipo de pago
  const [topDishes, setTopDishes] = useState<
    { dish: string; totalSold: number }[]
  >([]);
  const [salesByEmployee, setSalesByEmployee] = useState<
    { empleado: string; totalSold: number }[]
  >([]); // Estado para ventas por empleado
  const [loading, setLoading] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const [selectedPredefinedRange, setSelectedPredefinedRange] = useState<
    number | null
  >(null);
  const [customDateMode, setCustomDateMode] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    if (!dateRange.startDate || !dateRange.endDate) return;

    setLoading(true);
    try {
      // Llama a la API para obtener las ganancias totales y las ganancias por tipo de pago
      const earningsData = await fetchEarnings(
        dateRange.startDate,
        dateRange.endDate
      );

      // Llama a la API para obtener los platos más vendidos
      const topDishesData = await fetchTopSellingDishes(
        dateRange.startDate,
        dateRange.endDate
      );
      const salesByEmployeeData = await fetchSalesByEmployee(
        dateRange.startDate,
        dateRange.endDate
      );

      setEarnings(earningsData.earnings);
      setEarningsByPaymentType(earningsData.earningsByPaymentType);
      setTopDishes(topDishesData);
      setSalesByEmployee(salesByEmployeeData);
    } catch (error) {
      console.error("Error al cargar los datos del dashboard", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchData();
    }
  }, [fetchData, dateRange]);

  const startOfLocalDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfLocalDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  const setPredefinedRange = (days: number) => {
    const now = new Date();
    const todayStart = startOfLocalDay(now);
    const effectiveDaysBack = days <= 1 ? days : days - 1; // para 7 => 6 días atrás + hoy = 7 días
    const start = new Date(todayStart.getTime() - effectiveDaysBack * 24 * 60 * 60 * 1000);
    const end = endOfLocalDay(now);

    setDateRange({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    setCustomDateMode(false);
    setSelectedPredefinedRange(days);
  };

  const setFullYearRange = () => {
    const now = new Date();
    const start = startOfLocalDay(new Date(now.getFullYear(), 0, 1));
    const end = endOfLocalDay(now);
    setDateRange({ startDate: start.toISOString(), endDate: end.toISOString() });
    setCustomDateMode(false);
    setSelectedPredefinedRange(365);
  };

  const handleDateChange = (key: "startDate" | "endDate", value: string) => {
    const raw = new Date(value + 'T00:00:00'); // interpretado en local
    const adjusted = key === 'startDate' ? startOfLocalDay(raw) : endOfLocalDay(raw);
    setDateRange(prev => ({ ...prev, [key]: adjusted.toISOString() }));
    setCustomDateMode(true);
    setSelectedPredefinedRange(null);
  };

  const handleCustomSearch = () => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchData();
    }
  };

  return (
    <TabsContent value="dashboard-summary">
      <Card className="border-t-2 border-[#00631b]">
        <CardHeader>
          <CardTitle className="text-gray-800 border-b-2 border-[#00631b] inline-block pb-1">
            Resumen del Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <Label className="text-gray-600 font-medium">
                Rango de Fechas
              </Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { days: 0, label: "Hoy" },
                  { days: 7, label: "Últimos 7 días" },
                  { days: 30, label: "Últimos 30 días" },
                  { days: 365, label: "De todo el año" },
                ].map(({ days, label }) => (
                  <Button
                    key={days}
                    onClick={() =>
                      days === 365
                        ? setFullYearRange()
                        : setPredefinedRange(days)
                    }
                    variant={
                      selectedPredefinedRange === days ? "default" : "outline"
                    }
                    className={
                      selectedPredefinedRange === days
                        ? "bg-[#00631b] text-white hover:bg-[#00631b]/90"
                        : "hover:border-[#00631b]"
                    }
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-gray-600 font-medium">Personalizado</Label>
              <div className="flex flex-wrap gap-2 items-end">
                <div>
                  <Label htmlFor="startDate">Fecha de Inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={
                      dateRange.startDate
                        ? dateRange.startDate.split("T")[0]
                        : ""
                    }
                    onChange={(e) => {
                      handleDateChange("startDate", e.target.value);
                      setCustomDateMode(true);
                      setSelectedPredefinedRange(null);
                    }}
                    max={
                      dateRange.endDate
                        ? dateRange.endDate.split("T")[0]
                        : undefined
                    }
                    className="border-gray-300 focus:ring-gray-400 focus:border-gray-400"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Fecha de Fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={
                      dateRange.endDate ? dateRange.endDate.split("T")[0] : ""
                    }
                    onChange={(e) => {
                      handleDateChange("endDate", e.target.value);
                      setCustomDateMode(true);
                      setSelectedPredefinedRange(null);
                    }}
                    min={
                      dateRange.startDate
                        ? dateRange.startDate.split("T")[0]
                        : undefined
                    }
                    className="border-gray-300 focus:ring-gray-400 focus:border-gray-400"
                  />
                </div>
                <Button
                  onClick={handleCustomSearch}
                  disabled={!dateRange.startDate || !dateRange.endDate}
                  variant={customDateMode ? "default" : "outline"}
                  className={
                    customDateMode
                      ? "bg-gray-800 hover:bg-gray-700"
                      : "hover:bg-gray-100"
                  }
                >
                  Buscar
                </Button>
              </div>
            </div>
          </div>
          <div className="mb-6">
            <Label className="font-bold">Ganancias Totales</Label>
            {loading ? (
              <Spinner className="text-gray-600" />
            ) : (
              <p className="text-3xl font-bold text-[#00631b]">
                S/. {Number(earnings).toFixed(2)}
              </p>
            )}
          </div>

          <div className="mb-6">
            <Label className="font-bold">Ganancias por Tipo de Pago</Label>
            {loading ? (
              <Spinner />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo de Pago</TableHead>
                    <TableHead>Ganancias</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Efectivo</TableCell>
                    <TableCell>
                      S/. {earningsByPaymentType.efectivo.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Yape</TableCell>
                    <TableCell>
                      S/. {earningsByPaymentType.yape.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>POS</TableCell>
                    <TableCell>
                      S/. {earningsByPaymentType.pos.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </div>

          <div>
            <Label className="font-bold">Platos Más Vendidos</Label>
            {loading ? (
              <Spinner className="text-gray-600" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-600 border-b-2 border-[#00631b]">
                      Plato
                    </TableHead>
                    <TableHead className="text-gray-600 border-b-2 border-[#00631b]">
                      Total Vendido
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topDishes.map((dish, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-[#00631b]/5 transition-colors"
                    >
                      <TableCell>{dish.dish}</TableCell>
                      <TableCell>{dish.totalSold}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="mb-6">
            <Label className="font-bold">Ventas por Empleado</Label>
            {loading ? (
              <Spinner />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Total Vendido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesByEmployee.map((employee, index) => (
                    <TableRow key={index}>
                      <TableCell>{employee.empleado}</TableCell>
                      <TableCell>S/. {employee.totalSold.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};
