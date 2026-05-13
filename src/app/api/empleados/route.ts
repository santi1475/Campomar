import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { CreateEmpleadoSchema, parseJson } from "@/app/api/_lib/dto";

export async function GET() {
  const empleados = await prisma.empleados.findMany();
  return NextResponse.json(empleados);
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, CreateEmpleadoSchema);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.message, details: parsed.details },
      { status: parsed.status }
    );
  }
  const { DNI, Nombre, Password, TipoEmpleadoID } = parsed.data;

  try {
    const hashed = await bcrypt.hash(Password, 10);
    const empleado = await prisma.empleados.create({
      data: { Nombre, TipoEmpleadoID, DNI, Password: hashed },
    });
    const { Password: _omit, ...safe } = empleado;
    return NextResponse.json(safe);
  } catch (error) {
    return NextResponse.json(
      { message: "Error al crear empleado", error: String(error) },
      { status: 400 }
    );
  }
}
