"use client";

import React, { useEffect, useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit, PlusCircle, Trash2 } from 'lucide-react';
import { mesas } from "@prisma/client";
import { Spinner } from "@/components/ui/spinner";
import PedidosModal from "@/components/administrador/Gestion/ModalPedido";
import { ModalConfirm } from "@/components/trabajadores/boleta/ModalConfirm";

interface PedidoActivo {
  PedidoID: number;
  tipoPago: number;
}

export const GestionMesas = () => {
  const [tables, setTables] = useState<mesas[]>([]);
  const [activePedidos, setActivePedidos] = useState<Record<number, PedidoActivo>>({});
  const [newTable, setNewTable] = useState<mesas>({
    MesaID: 0,
    NumeroMesa: 0,
    Estado: "Libre",
  });
  const [editingTable, setEditingTable] = useState<mesas | null>(null);
  const [loadingTables, setLoadingTables] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; mesaId: number | null }>({ open: false, mesaId: null });
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch("/api/mesas", { method: "GET" });

        if (!response.ok) throw new Error("Error al obtener las mesas");

        const mesas = await response.json();
        setTables(mesas);

        // Fetch active pedidos for each table
        fetchActivePedidosForTables(mesas);
      } catch (error) {
        console.error(error);
      }
    };

    fetchTables();
  }, []);

  // Fetch active pedidos for all tables
  const fetchActivePedidosForTables = async (mesas: mesas[]) => {
    try {
      const pedidosMap: Record<number, PedidoActivo> = {};

      // For each table with status "Ocupada", fetch its active pedido
      const promises = mesas
        .filter(mesa => mesa.Estado === "Ocupada")
        .map(async (mesa) => {
          const pedidoResponse = await fetch(`/api/pedidos/activo/mesa/${mesa.MesaID}`);
          if (pedidoResponse.ok) {
            const pedido = await pedidoResponse.json();
            if (pedido && pedido.PedidoID) {
              pedidosMap[mesa.MesaID] = {
                PedidoID: pedido.PedidoID,
                tipoPago: pedido.tipoPago || 1 // Default to 1 if tipoPago is not provided
              };
            }
          }
        });

      await Promise.all(promises);
      setActivePedidos(pedidosMap);
    } catch (error) {
      console.error("Error fetching active pedidos:", error);
    }
  };

  const handleAddTable = async () => {
    if (newTable?.NumeroMesa && newTable.Estado) {
      setLoadingTables(true);
      try {
        const response = await fetch("/api/mesas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            NumeroMesa: newTable.NumeroMesa,
            Estado: newTable.Estado,
          }),
        });

        if (!response.ok) throw new Error("Error al agregar la mesa");

        const mesa = await response.json();
        setTables([...tables, mesa]);
        setNewTable({ MesaID: 0, Estado: "Libre", NumeroMesa: 0 });
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingTables(false);
      }
    }
  };

  const handleEditTable = async () => {
    if (!editingTable?.NumeroMesa || editingTable.NumeroMesa <= 0) {
      setErrorMsg("El número de mesa debe ser mayor que cero.");
      return;
    }
    // Validar que no exista otra mesa con el mismo número
    const existe = tables.some(
      (mesa) => mesa.NumeroMesa === editingTable.NumeroMesa && mesa.MesaID !== editingTable.MesaID
    );
    if (existe) {
      setErrorMsg("Ya existe una mesa con ese número.");
      return;
    }
    setLoadingTables(true);
    setErrorMsg("");
    try {
      const response = await fetch(`/api/mesas/${editingTable.MesaID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          NumeroMesa: editingTable.NumeroMesa,
          Estado: editingTable.Estado,
        }),
      });

      if (!response.ok) throw new Error("Error al actualizar la mesa");

      const updatedMesa = await response.json();
      setTables((prevTables) =>
        prevTables.map((mesa) =>
          mesa.MesaID === updatedMesa.MesaID ? updatedMesa : mesa
        )
      );
      setEditingTable(null);
      setErrorMsg("");
    } catch (error) {
      setErrorMsg("Error al actualizar la mesa");
      console.error(error);
    } finally {
      setLoadingTables(false);
    }
  };

  const handleDeleteTable = async (id: number) => {
    try {
      const response = await fetch(`/api/mesas/${id}`, { method: "DELETE" });

      if (!response.ok) throw new Error("Error al eliminar la mesa");

      setTables(tables.filter((table) => table.MesaID !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const selectTableForEdit = (table: mesas) => {
    setEditingTable(table);
  };


  return (
    <TabsContent value="tables">
      <Card className="border-t-2 border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">
            Gestión de Mesas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="tableNumber" className="text-sm font-medium text-gray-700">
                {editingTable ? "Editar Mesa" : "Número de Mesa"}
              </Label>
              <Input
                id="tableNumber"
                value={editingTable ? editingTable.NumeroMesa : newTable.NumeroMesa}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (editingTable) {
                    setEditingTable({
                      ...editingTable,
                      NumeroMesa: value,
                    });
                  } else {
                    setNewTable({
                      ...newTable,
                      NumeroMesa: value,
                    });
                  }
                  setErrorMsg("");
                }}
                placeholder="Número de Mesa"
                type="number"
                min={1}
                className="mt-1 border-gray-300 focus:border-gray-400 focus:ring focus:ring-gray-200 focus:ring-opacity-50"
              />
              {errorMsg && (
                <div className="text-red-600 text-xs mt-1">{errorMsg}</div>
              )}
            </div>
            <Button
              onClick={editingTable ? handleEditTable : handleAddTable}
              className="mt-auto bg-gray-800 hover:bg-gray-700 text-white"
              disabled={loadingTables}
            >
              {loadingTables ? <Spinner className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              {editingTable ? "Guardar Cambios" : "Añadir Mesa"}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {tables.map((table) => (
              <div key={table.MesaID} className="relative group">
                <div className={`w-full aspect-square rounded-lg flex items-center justify-center text-2xl font-bold transition-colors 
                  ${table.Estado === 'Libre' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {table.NumeroMesa}
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center 
                  opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                  <div className="flex space-x-2">
                    <Button variant="secondary" size="sm" onClick={() => selectTableForEdit(table)}
                      className="bg-white text-gray-800 hover:bg-gray-100">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setConfirmDelete({ open: true, mesaId: table.MesaID })}
                      className="bg-white text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <PedidosModal mesas={[table.MesaID]} triggerText="Pedido" />
                  </div>
                </div>
                <div className="mt-2 text-center text-sm font-medium text-gray-700">
                  {table.Estado}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <ModalConfirm
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, mesaId: null })}
        onConfirm={() => {
          if (confirmDelete.mesaId !== null) handleDeleteTable(confirmDelete.mesaId);
          setConfirmDelete({ open: false, mesaId: null });
        }}
        message="¿Estás seguro de que deseas eliminar esta mesa?"
      />
    </TabsContent>
  );
};