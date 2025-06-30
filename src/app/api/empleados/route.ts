import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import * as yup from "yup";

export async function GET(request: Request) {
  const empleados = await prisma.empleados.findMany();

  if (!empleados) {
    return NextResponse.json(
      { message: "No se encontraron empleados" },
      { status: 404 }
    );
  }

  return NextResponse.json(empleados);
}

// Nombre varchar(100)
// TipoEmpleadoID int
// DNI char(8)
// Password

const postSchema = yup.object({
  Nombre: yup.string().required(),
  TipoEmpleadoID: yup.number().required(),
  DNI: yup.string().required(),
  Password: yup.string().required(),
});

export async function POST(request: Request) {
  try {
    const { DNI, Nombre, Password, TipoEmpleadoID } = await postSchema.validate(
      await request.json()
    );

    const empleado = await prisma.empleados.create({
      data: {
        Nombre,
        TipoEmpleadoID,
        DNI,
        Password,
      },
    });

    return NextResponse.json(empleado);
  } catch (error) {
    return NextResponse.json(error, { status: 400 });
  }
}
