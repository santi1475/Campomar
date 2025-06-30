"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { platos } from "@prisma/client";
import { motion } from "framer-motion";

async function fetchPlatos(): Promise<platos[]> {
  const response = await fetch("/api/platos", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener los platos");
  }

  return response.json();
}

const categorias: { [key: number]: string } = {
  1: "Criollo",
  2: "Bebida",
  3: "Porción",
  4: "Caldo",
  5: "Otro",
};

export function ListaPlatos() {
  const [platos, setPlatos] = useState<platos[]>([]);
  const [filteredPlatos, setFilteredPlatos] = useState<platos[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");

  useEffect(() => {
    fetchPlatos()
      .then((data) => {
        setPlatos(data);
        setFilteredPlatos(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const filtered = platos.filter((plato) =>
      plato.Descripcion!.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const categoryFiltered = filtered.filter((plato) => {
      if (filterCategory === "todos" || filterCategory === "") {
        return true;
      }
      return plato.CategoriaID === parseInt(filterCategory);
    });
    setFilteredPlatos(categoryFiltered);
  }, [searchTerm, filterCategory, platos]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <Card className="w-full max-w-6xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 shadow-lg mt-3 mb-6">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-3xl font-bold text-gray-800 dark:text-gray-100">Menú de Platos</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
          <Input
            placeholder="Buscar plato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full md:w-[180px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="1">Criollo</SelectItem>
              <SelectItem value="2">Bebida</SelectItem>
              <SelectItem value="3">Porción</SelectItem>
              <SelectItem value="4">Caldo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlatos.map((plato) => (
            <motion.div
              key={plato.PlatoID}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full bg-white dark:bg-gray-800 hover:shadow-md transition-shadow duration-300 overflow-hidden">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{plato.Descripcion}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{categorias[plato.CategoriaID] || "Otro"}</p>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">S/{plato.Precio!.toString()}</span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded-full">
                      {categorias[plato.CategoriaID] || "Otro"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <Skeleton className="h-8 w-64" />
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex space-x-4 mb-6">
          <Skeleton className="h-10 flex-grow" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="h-[150px]">
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <ExclamationTriangleIcon className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

