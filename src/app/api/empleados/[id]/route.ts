import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { UpdateEmpleadoSchema, parseJson } from "@/app/api/_lib/dto";

interface Segments {
  params: { id: string };
}

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$/;

export async function GET(_request: NextRequest, { params }: Segments) {
  const empleadoId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(empleadoId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  const empleado = await prisma.empleados.findFirst({
    where: { EmpleadoID: empleadoId },
  });

  if (!empleado) {
    return NextResponse.json(
      { message: `Employee with id ${params.id} not found` },
      { status: 404 }
    );
  }

  const { Password: _omit, ...safe } = empleado;
  return NextResponse.json(safe);
}

export async function PUT(request: NextRequest, { params }: Segments) {
  const empleadoId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(empleadoId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  const empleado = await prisma.empleados.findFirst({
    where: { EmpleadoID: empleadoId },
  });

  if (!empleado) {
    return NextResponse.json(
      { message: `Employee with id ${params.id} not found` },
      { status: 404 }
    );
  }

  const parsed = await parseJson(request, UpdateEmpleadoSchema);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.message, details: parsed.details },
      { status: parsed.status }
    );
  }
  const { DNI, Nombre, Password, TipoEmpleadoID, Activo } = parsed.data;

  try {
    const passwordToStore = BCRYPT_HASH_REGEX.test(Password)
      ? Password
      : await bcrypt.hash(Password, 10);

    const updatedEmpleado = await prisma.empleados.update({
      where: { EmpleadoID: empleadoId },
      data: { DNI, Nombre, Password: passwordToStore, TipoEmpleadoID, Activo },
    });

    const { Password: _omit, ...safe } = updatedEmpleado;
    return NextResponse.json(safe);
  } catch (error) {
    return NextResponse.json(
      { message: "Error al actualizar empleado", error: String(error) },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Segments) {
  const empleadoId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(empleadoId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  const empleado = await prisma.empleados.findFirst({
    where: { EmpleadoID: empleadoId },
  });

  if (!empleado) {
    return NextResponse.json(
      { message: `Empleado con id ${params.id} no encontrado` },
      { status: 404 }
    );
  }

  const deletedEmpleado = await prisma.empleados.delete({
    where: { EmpleadoID: empleadoId },
  });

  const { Password: _omit, ...safe } = deletedEmpleado;
  return NextResponse.json(safe);
}
