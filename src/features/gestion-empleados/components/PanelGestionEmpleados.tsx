"use client";

import React, { useEffect, useState } from "react";
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
import { Edit, PlusCircle, UserCheck, UserX } from 'lucide-react'; // Importamos los nuevos iconos
import { empleados } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge"; // Importamos Badge para el estado

export const GestionEmpleados = () => {
  const [employees, setEmployees] = useState<empleados[]>([]);
  const [newEmployee, setNewEmployee] = useState<Partial<empleados>>({
    Nombre: "",
    TipoEmpleadoID: 1,
    DNI: "",
    Password: "",
    Activo: true,
  });
  const [editingEmployee, setEditingEmployee] = useState<empleados | null>(null);
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(false);

  // Función para obtener los empleados
  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await fetch("/api/empleados");
      if (!response.ok) throw new Error("Error al obtener los empleados");
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async () => {
    if (newEmployee.DNI && newEmployee.Nombre && newEmployee.Password && newEmployee.TipoEmpleadoID) {
      try {
        const response = await fetch("/api/empleados", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newEmployee),
        });
        if (!response.ok) throw new Error("Error al agregar el empleado");
        fetchEmployees(); // Volvemos a cargar los empleados
        setNewEmployee({ Nombre: "", TipoEmpleadoID: 1, DNI: "", Password: "", Activo: true });
      } catch (error) {
        console.error(error);
      }
    } else {
      alert("Por favor, rellena todos los campos");
    }
  };

  const handleEditEmployee = async () => {
    if (editingEmployee) {
      try {
        const response = await fetch(`/api/empleados/${editingEmployee.EmpleadoID}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingEmployee),
        });
        if (!response.ok) throw new Error("Error al actualizar el empleado");
        setEditingEmployee(null);
        fetchEmployees();
      } catch (error) {
        console.error(error);
      }
    }
  };

  // =================== NUEVA FUNCIÓN PARA HABILITAR/DESHABILITAR ===================
  const handleToggleEmployeeStatus = async (employee: empleados) => {
    // Preparamos el objeto con el estado invertido
    const updatedEmployeeData = { ...employee, Activo: !employee.Activo };

    try {
      const response = await fetch(`/api/empleados/${employee.EmpleadoID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedEmployeeData),
      });

      if (!response.ok) {
        throw new Error("Error al cambiar el estado del empleado");
      }

      // Actualizamos la lista de empleados para reflejar el cambio
      setEmployees(employees.map(emp => 
        emp.EmpleadoID === employee.EmpleadoID 
          ? { ...emp, Activo: !emp.Activo } 
          : emp
      ));
    } catch (error) {
      console.error(error);
    }
  };
  // =================== FIN DE LA NUEVA FUNCIÓN ===================

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
              <Label htmlFor="employeeName">Nombre Empleado</Label>
              <Input
                value={editingEmployee ? editingEmployee.Nombre! : newEmployee.Nombre!}
                onChange={(e) => editingEmployee ? setEditingEmployee({ ...editingEmployee, Nombre: e.target.value }) : setNewEmployee({ ...newEmployee, Nombre: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="employeeRole">Tipo de Empleado</Label>
              <Select
                value={(editingEmployee ? editingEmployee.TipoEmpleadoID : newEmployee.TipoEmpleadoID)?.toString()}
                onValueChange={(value) => {
                  const tipoId = Number(value);
                  editingEmployee ? setEditingEmployee({ ...editingEmployee, TipoEmpleadoID: tipoId }) : setNewEmployee({ ...newEmployee, TipoEmpleadoID: tipoId });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Mesero</SelectItem>
                  <SelectItem value="2">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="employeeDNI">DNI</Label>
              <Input
                value={editingEmployee ? editingEmployee.DNI! : newEmployee.DNI!}
                onChange={(e) => editingEmployee ? setEditingEmployee({ ...editingEmployee, DNI: e.target.value }) : setNewEmployee({ ...newEmployee, DNI: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="employeePassword">Contraseña</Label>
              <Input
                type="password"
                value={editingEmployee ? editingEmployee.Password! : newEmployee.Password!}
                onChange={(e) => editingEmployee ? setEditingEmployee({ ...editingEmployee, Password: e.target.value }) : setNewEmployee({ ...newEmployee, Password: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end mb-8">
            <Button onClick={editingEmployee ? handleEditEmployee : handleAddEmployee}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {editingEmployee ? "Guardar Cambios" : "Añadir Empleado"}
            </Button>
            {editingEmployee && (
              <Button variant="ghost" onClick={() => setEditingEmployee(null)} className="ml-2">
                Cancelar
              </Button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>DNI</TableHead>
                  {/* === NUEVA COLUMNA === */}
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.EmpleadoID}>
                    <TableCell>{employee.Nombre}</TableCell>
                    <TableCell>{employee.TipoEmpleadoID === 1 ? "Mesero" : "Admin"}</TableCell>
                    <TableCell>{employee.DNI}</TableCell>
                    {/* === CELDA PARA EL ESTADO === */}
                    <TableCell>
                      <Badge variant={employee.Activo ? "default" : "destructive"} className={employee.Activo ? 'bg-green-600' : ''}>
                        {employee.Activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex space-x-2 justify-end">
                        {/* === BOTÓN DE HABILITAR/DESHABILITAR === */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleEmployeeStatus(employee)}
                          title={employee.Activo ? "Deshabilitar" : "Habilitar"}
                        >
                          {employee.Activo ? <UserX className="h-4 w-4 text-red-600" /> : <UserCheck className="h-4 w-4 text-green-600" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => selectEmployeeForEdit(employee)}>
                          <Edit className="h-4 w-4" />
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
