import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import * as yup from "yup";

interface Segments {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: Segments) {
  const { id } = params;

  const empleado = await prisma.empleados.findFirst({
    where: { EmpleadoID: parseInt(id) },
  });

  if (!empleado) {
    return NextResponse.json(
      { message: `Employee with id ${id} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json(empleado);
}

const putSchema = yup.object({
  Nombre: yup.string().required(),
  TipoEmpleadoID: yup.number().required(),
  DNI: yup.string().required(),
  Password: yup.string().required(),
});

export async function PUT(request: Request, { params }: Segments) {
  const { id } = params;

  const empleado = await prisma.empleados.findFirst({
    where: { EmpleadoID: parseInt(id) },
  });

  if (!empleado) {
    return NextResponse.json(
      { message: `Employee with id ${id} not found` },
      { status: 404 }
    );
  }

  try {
    const { DNI, Nombre, Password, TipoEmpleadoID } = await putSchema.validate(
      await request.json()
    );

    const updatedEmpleado = await prisma.empleados.update({
      where: { EmpleadoID: parseInt(id) },
      data: { DNI, Nombre, Password, TipoEmpleadoID },
    });

    return NextResponse.json(updatedEmpleado);
  } catch (error) {
    return NextResponse.json(error, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: Segments) {
  const { id } = params;

  const empleado = await prisma.empleados.findFirst({
    where: { EmpleadoID: parseInt(id) },
  });

  if (!empleado) {
    return NextResponse.json(
      { message: `Empleado con id ${id} no encontrado` },
      { status: 404 }
    );
  }

  const deletedEmpleado = await prisma.empleados.delete({
    where: { EmpleadoID: parseInt(id) },
  });

  return NextResponse.json(deletedEmpleado);
}
