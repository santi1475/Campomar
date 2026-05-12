"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/shared/ui/spinner";
import { MesaEstado, type mesas } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "lucide-react";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 3000;

export const Mesas = () => {
  const router = useRouter();
  const [mesas, setMesas] = useState<mesas[]>([]);
  const [selectedTableIds, setSelectedTableIds] = useState<number[]>([]);
  const [linkedTables, setLinkedTables] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigatingRef = useRef(false);

  const mesasById = useMemo(() => {
    const map = new Map<number, mesas>();
    for (const m of mesas) map.set(m.MesaID, m);
    return map;
  }, [mesas]);

  const selectedTables = useMemo(
    () =>
      selectedTableIds
        .map((id) => mesasById.get(id))
        .filter((m): m is mesas => m !== undefined),
    [selectedTableIds, mesasById]
  );

  useEffect(() => {
    const controller = new AbortController();
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let mounted = true;

    const fetchMesas = async (isInitial: boolean) => {
      try {
        const response = await fetch("/api/mesas", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Error al obtener las mesas");

        const data: mesas[] = await response.json();
        if (!mounted) return;

        setMesas(data);

        if (isInitial) {
          setLinkedTables([]);
          return;
        }

        const ocupadasIds = new Set(
          data
            .filter((m) => m.Estado === MesaEstado.Ocupada)
            .map((m) => m.MesaID)
        );

        setSelectedTableIds((prev) => {
          const conflict = prev.filter((id) => ocupadasIds.has(id));
          if (conflict.length === 0) return prev;
          const numeros = conflict
            .map((id) => data.find((m) => m.MesaID === id)?.NumeroMesa)
            .filter((n): n is number => typeof n === "number")
            .join(", ");
          toast.info(
            `Mesa(s) ${numeros} ocupadas por otro empleado. Selección actualizada.`
          );
          return prev.filter((id) => !ocupadasIds.has(id));
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("[GridMesas] fetch error", error);
        if (isInitial) {
          toast.error("Error al cargar mesas. Intenta recargar.");
        }
      }
    };

    fetchMesas(true);
    intervalId = setInterval(() => {
      if (navigatingRef.current) return;
      fetchMesas(false);
    }, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      controller.abort();
      if (intervalId !== null) clearInterval(intervalId);
    };
  }, []);

  const handleSelectTable = useCallback((mesaId: number) => {
    setSelectedTableIds((prev) =>
      prev.includes(mesaId) ? prev.filter((id) => id !== mesaId) : [...prev, mesaId]
    );
  }, []);

  const handleGoToTable = useCallback(() => {
    if (selectedTableIds.length === 0) return;

    const tables = selectedTableIds
      .map((id) => mesasById.get(id))
      .filter((m): m is mesas => m !== undefined);

    const ocupada = tables.find((t) => t.Estado === MesaEstado.Ocupada);
    if (ocupada) {
      toast.warning(`Mesa ${ocupada.NumeroMesa} está ocupada.`);
      return;
    }

    setIsNavigating(true);
    navigatingRef.current = true;
    const query = selectedTableIds.join(",");
    router.push(`/empleado/sala/mesa?mesas=${query}`);
  }, [selectedTableIds, mesasById, router]);

  const handleOccupiedTable = useCallback(
    async (mesa: mesas) => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/mesas/relacion?mesaId=${mesa.MesaID}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        if (!response.ok) {
          toast.error("Error al obtener la mesa.");
          return;
        }
        const data: mesas[] = await response.json();
        const mesasRelacionadas = data.map((m) => m.MesaID);

        setLinkedTables(mesasRelacionadas);
        navigatingRef.current = true;
        router.push(`/empleado/sala/mesa?mesas=${mesasRelacionadas.join(",")}`);
      } catch (error) {
        console.error("[GridMesas] occupied error", error);
        toast.error("Error al abrir la mesa ocupada.");
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  return (
    <div className="w-full p-2 sm:p-4 md:p-6 lg:p-8">
      <Card className="w-full max-w-7xl mx-auto shadow-md">
        <CardHeader className="bg-white border-b p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 text-center sm:text-left">
            Sala del Restaurante
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-4 mb-6">
            {mesas.map((mesa) => {
              const isSelected = selectedTableIds.includes(mesa.MesaID);
              const isOcupada = mesa.Estado === MesaEstado.Ocupada;
              const isLinked = linkedTables.includes(mesa.MesaID);

              return (
                <Button
                  key={mesa.MesaID}
                  onClick={
                    isOcupada
                      ? () => handleOccupiedTable(mesa)
                      : () => handleSelectTable(mesa.MesaID)
                  }
                  variant={isSelected ? "default" : "outline"}
                  className={`
                    h-12 sm:h-14 md:h-16 w-full text-xs sm:text-sm md:text-base font-medium rounded transition-colors duration-200
                    ${
                      isSelected
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-white text-gray-800 hover:bg-gray-100"
                    }
                    ${isOcupada ? "bg-red-500 text-white hover:bg-red-600" : ""}
                    ${isLinked ? "border-4 border-blue-500" : ""}
                  `}
                >
                  {isLoading ? (
                    <Spinner size="small" className="text-current" />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <span className="truncate px-1">Mesa {mesa.NumeroMesa}</span>
                      {isLinked && linkedTables.length > 1 && (
                        <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-1 shadow-md">
                          <Link size={16} />
                        </div>
                      )}
                    </div>
                  )}
                </Button>
              );
            })}
          </div>

          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
              <div className="flex flex-col space-y-2">
                <span className="font-medium text-sm sm:text-base text-gray-700">
                  - Mesas seleccionadas:
                </span>
                <div className="flex flex-wrap gap-1 sm:gap-2 max-w-full">
                  {selectedTables.length === 0 ? (
                    <span className="text-xs sm:text-sm text-gray-500 italic">
                      Ninguna mesa seleccionada
                    </span>
                  ) : (
                    selectedTables.map((table) => (
                      <Badge
                        key={table.MesaID}
                        variant="outline"
                        className="text-xs sm:text-sm py-1 px-2 bg-gray-100 whitespace-nowrap"
                      >
                        {table.NumeroMesa}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-center sm:justify-end w-full sm:w-auto">
                <Button
                  onClick={handleGoToTable}
                  disabled={selectedTableIds.length === 0 || isNavigating}
                  className="w-full sm:w-auto min-w-[140px] bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 sm:px-6 rounded transition-colors duration-200 flex items-center justify-center text-sm sm:text-base"
                >
                  {isNavigating ? (
                    <>
                      <Spinner size="small" className="mr-2 text-white" />
                      <span className="hidden sm:inline">Cargando...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Ir a la Carta</span>
                      <span className="sm:hidden">Carta</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
