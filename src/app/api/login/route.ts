import prisma from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { DNI, password } = await request.json();

  try {
    // Busca el usuario por DNI
    const empleado = await prisma.empleados.findUnique({
      where: {
        DNI,
      },
    });

    // Si no se encuentra el usuario o la contraseña no coincide
    if (!empleado || empleado.Password !== password) {
      return NextResponse.json({ message: 'Credenciales incorrectas' }, { status: 401 });
    }

    // =================== INICIO DE LA CORRECCIÓN ===================
    // VERIFICAMOS SI EL EMPLEADO ESTÁ ACTIVO
    if (!empleado.Activo) {
        return NextResponse.json({ message: 'Este usuario ha sido deshabilitado.' }, { status: 403 }); // 403 Forbidden
    }
    // =================== FIN DE LA CORRECCIÓN ===================


    // Si las credenciales son correctas y el usuario está activo
    return NextResponse.json({ message: 'Inicio de sesión exitoso', empleado });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
