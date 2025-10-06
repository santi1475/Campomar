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
    let body: any;
    try {
      body = await request.json();
    } catch (err) {
      console.warn('POST /api/empleados: request.json() falló o body vacío/no JSON válido', err);
      return NextResponse.json({ message: 'Se requiere un cuerpo JSON válido' }, { status: 400 });
    }

    const { DNI, Nombre, Password, TipoEmpleadoID } = await postSchema.validate(body);

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
