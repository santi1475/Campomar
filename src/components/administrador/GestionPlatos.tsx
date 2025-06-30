"use client";

import React, { useEffect, useState } from "react";
import { TabsContent } from "../ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Edit, PlusCircle, Trash2, Search } from "lucide-react";
import { platos } from "@prisma/client";
import { Spinner } from "../ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
// PASO 1: Importar el tipo Decimal de Prisma
import { Decimal } from "@prisma/client/runtime/library";

export const GestionPlatos = () => {
  const [dishes, setDishes] = useState<platos[]>([]);
  
  // PASO 2: Inicializar el estado con 'new Decimal()'
  const [newDish, setNewDish] = useState<platos>({
    PlatoID: 0,
    Descripcion: "",
    Precio: new Decimal(0),
    CategoriaID: 1, // Es buena práctica tener un valor por defecto
  });

  const [editingDish, setEditingDish] = useState<platos | null>(null);
  const [loadingDishes, setLoadingDishes] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const fetchDishes = async () => {
      try {
        const response = await fetch("/api/platos", { method: "GET" });
        if (!response.ok) throw new Error("Error al obtener los platos");
        const data = await response.json();
        // Convertir precios a Decimal al recibir los datos
        const platosConDecimal = data.map((plato: any) => ({
          ...plato,
          Precio: new Decimal(plato.Precio),
        }));
        setDishes(platosConDecimal);
      } catch (error) {
        console.error(error);
      }
    };
    fetchDishes();
  }, []);

  const handleAddDish = async () => {
    if (newDish?.Descripcion && newDish.Precio && newDish.CategoriaID) {
      setLoadingDishes(true);
      try {
        const response = await fetch("/api/platos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Enviar como número a la API
          body: JSON.stringify({ ...newDish, Precio: Number(newDish.Precio) }),
        });
        if (!response.ok) throw new Error("Error al añadir el plato");
        const plato = await response.json();
        // Convertir el precio de la respuesta a Decimal antes de añadirlo al estado
        setDishes([...dishes, { ...plato, Precio: new Decimal(plato.Precio) }]);
        setNewDish({ PlatoID: 0, Descripcion: "", Precio: new Decimal(0), CategoriaID: 1 });
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingDishes(false);
      }
    }
  };

  const handleEditDish = async () => {
    if (editingDish?.Descripcion && editingDish?.Precio && editingDish?.CategoriaID) {
      setLoadingDishes(true);
      try {
        const response = await fetch(`/api/platos/${editingDish.PlatoID}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          // Enviar como número a la API
          body: JSON.stringify({ ...editingDish, Precio: Number(editingDish.Precio) }),
        });
        if (!response.ok) throw new Error("Error al editar el plato");
        const updatedPlato = await response.json();
        setDishes((prevDishes) =>
          prevDishes.map((dish) =>
            dish.PlatoID === updatedPlato.PlatoID 
              ? { ...updatedPlato, Precio: new Decimal(updatedPlato.Precio) } // Convertir a Decimal
              : dish
          )
        );
        setEditingDish(null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingDishes(false);
      }
    }
  };

  const handleDeleteDish = async (PlatoID: number) => {
    try {
      const response = await fetch(`/api/platos/${PlatoID}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error al eliminar el plato");
      setDishes(dishes.filter((dish) => dish.PlatoID !== PlatoID));
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectDish = (dish: platos) => setEditingDish(dish);

  const filteredDishes = dishes.filter((dish) =>
    dish.Descripcion?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryOptions = [
    { value: "1", label: "Criollo" },
    { value: "2", label: "Bebida" },
    { value: "3", label: "Porcion" },
    { value: "4", label: "Caldo" },
  ];

  return (
    <TabsContent value="dishes">
      <Card className="border-t-2 border-[#00631b]">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">
            Gestión de Platos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div>
              <Label htmlFor="dishDescription" className="text-sm font-medium text-gray-700">
                {editingDish ? "Editar Descripción" : "Descripción"}
              </Label>
              <Input
                id="dishDescription"
                value={editingDish ? editingDish.Descripcion! : newDish.Descripcion!}
                onChange={(e) =>
                  editingDish
                    ? setEditingDish({ ...editingDish, Descripcion: e.target.value })
                    : setNewDish({ ...newDish, Descripcion: e.target.value })
                }
                placeholder="Descripción del Plato"
                className="mt-1 border-gray-300 focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50"
              />
            </div>
            <div>
              <Label htmlFor="dishPrice" className="text-sm font-medium text-gray-700">
                {editingDish ? "Editar Precio" : "Precio"}
              </Label>
              <Input
                id="dishPrice"
                value={editingDish ? Number(editingDish.Precio) : Number(newDish.Precio)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  // PASO 3: Crear un nuevo objeto Decimal al cambiar el valor
                  const newPrice = isNaN(value) ? new Decimal(0) : new Decimal(value);
                  if (editingDish) {
                    setEditingDish({ ...editingDish, Precio: newPrice });
                  } else {
                    setNewDish({ ...newDish, Precio: newPrice });
                  }
                }}
                placeholder="Precio"
                type="number"
                step="0.01"
                className="mt-1 border-gray-300 focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50"
              />
            </div>
            <div>
              <Label htmlFor="dishCategory" className="text-sm font-medium text-gray-700">
                Categoría
              </Label>
              <Select
                value={(editingDish?.CategoriaID ?? newDish.CategoriaID)?.toString()}
                onValueChange={(value) => {
                  const catId = Number(value);
                  if (editingDish) {
                    setEditingDish({ ...editingDish, CategoriaID: catId });
                  } else {
                    setNewDish({ ...newDish, CategoriaID: catId });
                  }
                }}
              >
                <SelectTrigger id="dishCategory" className="mt-1 border-gray-300 focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mb-6">
            <Button
              onClick={editingDish ? handleEditDish : handleAddDish}
              className="bg-gray-800 hover:bg-gray-700 text-white"
              disabled={loadingDishes}
            >
              {loadingDishes ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {editingDish ? "Guardando..." : "Añadiendo..."}
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {editingDish ? "Guardar Cambios" : "Añadir Plato"}
                </>
              )}
            </Button>
          </div>
          <div className="mb-6">
            <Label htmlFor="searchDishes" className="text-sm font-medium text-gray-700">
              Buscar Platos
            </Label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="searchDishes"
                type="text"
                placeholder="Buscar por descripción"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300 focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDishes.map((dish) => (
              <Card key={dish.PlatoID} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-2">
                    {dish.Descripcion}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    Precio: S/. {Number(dish.Precio).toFixed(2)}
                  </p>
                  <p className="text-gray-600 mb-4">
                    Categoría:{" "}
                    {categoryOptions.find(
                      (cat) => cat.value === dish.CategoriaID?.toString()
                    )?.label || "Otro"}
                  </p>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectDish(dish)}
                      className="text-blue-600 hover:text-blue-700 hover:border-blue-300"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDish(dish.PlatoID)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};