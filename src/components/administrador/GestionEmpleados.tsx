"use client";

import React, { useEffect, useState } from "react";
import { TabsContent } from "../ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, PlusCircle, Trash2 } from 'lucide-react';
import { empleados } from "@prisma/client";
import { Spinner } from "../ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export const GestionEmpleados = () => {
  const [employees, setEmployees] = useState<empleados[]>([]);
  const [newEmployee, setNewEmployee] = useState<empleados>({
    EmpleadoID: 0,
    Nombre: "",
    TipoEmpleadoID: 0,
    DNI: "",
    Password: "",
  });
  const [editingEmployee, setEditingEmployee] = useState<empleados | null>(null);
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch("/api/empleados", {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error("Error al obtener los empleados");
        }

        const empleados = await response.json();
        setEmployees(empleados);
      } catch (error) {
        console.error(error);
      }
    };

    fetchEmployees();
  }, []);

  // Función para añadir un nuevo empleado
  const handleAddEmployee = async () => {
    if (
      newEmployee.DNI &&
      newEmployee.Nombre &&
      newEmployee.Password &&
      newEmployee.TipoEmpleadoID
    ) {
      setLoadingEmployees(true);
      try {
        const response = await fetch("/api/empleados", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            DNI: newEmployee.DNI,
            Nombre: newEmployee.Nombre,
            Password: newEmployee.Password,
            TipoEmpleadoID: newEmployee.TipoEmpleadoID,
          }),
        });

        if (!response.ok) {
          throw new Error("Error al agregar el empleado");
        }

        const empleado = await response.json();

        // Actualiza la lista de mesas con la mesa recién creada
        setEmployees([...employees, empleado]);

        // Resetea el formulario de nueva mesa
        setNewEmployee({
          EmpleadoID: 0,
          Nombre: "",
          TipoEmpleadoID: 0,
          DNI: "",
          Password: "",
        });
      } catch (error) {
        console.error(error);
        // Aquí podrías mostrar un mensaje de error al usuario
      } finally {
        setLoadingEmployees(false);
      }
    } else {
      alert("Por favor, rellena todos los campos");
    }
  };

  const handleEditEmployee = async () => {
    if (
      editingEmployee?.DNI &&
      editingEmployee.Nombre &&
      editingEmployee.Password &&
      editingEmployee.TipoEmpleadoID
    ) {
      setLoadingEmployees(true);

      try {
        const response = await fetch(
          `/api/empleados/${editingEmployee.EmpleadoID}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              DNI: editingEmployee.DNI,
              Nombre: editingEmployee.Nombre,
              Password: editingEmployee.Password,
              TipoEmpleadoID: editingEmployee.TipoEmpleadoID,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Error al actualizar el empleado");
        }

        const updatedEmpleado = await response.json();

        setEmployees((prevEmployees) =>
          prevEmployees.map((empleado) =>
            empleado.EmpleadoID === updatedEmpleado.EmpleadoID
              ? updatedEmpleado
              : empleado
          )
        );

        // Limpiar el formulario de edición
        setEditingEmployee(null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingEmployees(false);
      }
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    try {
      const response = await fetch(`/api/empleados/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el empleado");
      }

      // Eliminar la mesa del estado local
      setEmployees(employees.filter((employee) => employee.EmpleadoID !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const selectEmployeeForEdit = (employee: empleados) => {
    setEditingEmployee(employee);
  };

  return (
    <TabsContent value="employees">
      <Card className="border-t-2 border-[#00631b]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800 border-b-2 border-[#00631b] inline-block pb-2">
            Gestión de Empleados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div>
              <Label htmlFor="employeeName" className="text-gray-700 font-medium">
                {editingEmployee ? "Editar Nombre" : "Nombre Empleado"}
              </Label>
              <Input
                required
                id="employeeName"
                value={editingEmployee ? editingEmployee.Nombre! : newEmployee.Nombre!}
                onChange={(e) =>
                  editingEmployee
                    ? setEditingEmployee({ ...editingEmployee, Nombre: e.target.value })
                    : setNewEmployee({ ...newEmployee, Nombre: e.target.value })
                }
                placeholder="Nombre del Empleado"
                type="text"
                className="mt-1 border-gray-300 focus:border-[#00631b] focus:ring focus:ring-[#00631b] focus:ring-opacity-50"
              />
            </div>
            <div>
              <Label htmlFor="employeeRole" className="text-gray-700 font-medium">
                Tipo de Empleado
              </Label>
              <Select
                required
                value={
                  editingEmployee
                    ? editingEmployee.TipoEmpleadoID?.toString()
                    : newEmployee.TipoEmpleadoID?.toString()
                }
                onValueChange={(value) => {
                  editingEmployee
                    ? setEditingEmployee({ ...editingEmployee, TipoEmpleadoID: Number(value) })
                    : setNewEmployee({ ...newEmployee, TipoEmpleadoID: Number(value) });
                }}
              >
                <SelectTrigger id="employeeRole" className="mt-1 border-gray-300 focus:border-[#00631b] focus:ring focus:ring-[#00631b] focus:ring-opacity-50">
                  <SelectValue placeholder="Tipo de Empleado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Mesero</SelectItem>
                  <SelectItem value="2">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="employeeDNI" className="text-gray-700 font-medium">
                {editingEmployee ? "Editar DNI" : "DNI"}
              </Label>
              <Input
                required
                id="employeeDNI"
                value={editingEmployee ? editingEmployee.DNI! : newEmployee.DNI!}
                onChange={(e) =>
                  editingEmployee
                    ? setEditingEmployee({ ...editingEmployee, DNI: e.target.value })
                    : setNewEmployee({ ...newEmployee, DNI: e.target.value })
                }
                placeholder="DNI"
                type="text"
                className="mt-1 border-gray-300 focus:border-[#00631b] focus:ring focus:ring-[#00631b] focus:ring-opacity-50"
              />
            </div>
            <div>
              <Label htmlFor="employeePassword" className="text-gray-700 font-medium">
                {editingEmployee ? "Editar Contraseña" : "Contraseña"}
              </Label>
              <Input
                required
                id="employeePassword"
                value={editingEmployee ? editingEmployee.Password! : newEmployee.Password!}
                onChange={(e) =>
                  editingEmployee
                    ? setEditingEmployee({ ...editingEmployee, Password: e.target.value })
                    : setNewEmployee({ ...newEmployee, Password: e.target.value })
                }
                placeholder="Contraseña"
                type="password"
                className="mt-1 border-gray-300 focus:border-[#00631b] focus:ring focus:ring-[#00631b] focus:ring-opacity-50"
              />
            </div>
          </div>
          <div className="flex justify-end mb-8">
            <Button
              onClick={editingEmployee ? handleEditEmployee : handleAddEmployee}
              className="bg-[#00631b] hover:bg-[#00631b]/90 text-white"
              disabled={loadingEmployees}
            >
              {loadingEmployees ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {editingEmployee ? "Guardando..." : "Cargando..."}
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {editingEmployee ? "Guardar Cambios" : "Añadir Empleado"}
                </>
              )}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="font-semibold text-gray-700">Nombre</TableHead>
                  <TableHead className="font-semibold text-gray-700">Tipo</TableHead>
                  <TableHead className="font-semibold text-gray-700">DNI</TableHead>
                  <TableHead className="font-semibold text-gray-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.EmpleadoID} className="hover:bg-gray-50">
                    <TableCell>{employee.Nombre}</TableCell>
                    <TableCell>
                      {employee.TipoEmpleadoID == 1 ? "Mesero" : "Admin"}
                    </TableCell>
                    <TableCell>{employee.DNI}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectEmployeeForEdit(employee)}
                          className="text-blue-600 hover:text-blue-700 hover:border-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEmployee(employee.EmpleadoID)}
                          className="text-red-600 hover:text-red-700 hover:border-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

