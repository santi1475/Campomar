import prisma from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { DNI, password } = await request.json();

  try {
    // Busca el usuario por DNI
    const empleado = await prisma.empleados.findUnique({
      where: {
        DNI,
        Password: password,
      },
    });

    // Si no se encuentra el usuario o la contraseña no coincide
    if (!empleado) {
      return NextResponse.json({ message: 'Credenciales incorrectas' }, { status: 401 });
    }

    // Si las credenciales son correctas
    return NextResponse.json({ message: 'Inicio de sesión exitoso', empleado });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}