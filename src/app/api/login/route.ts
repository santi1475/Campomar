import prisma from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let DNI: string | undefined;
  let password: string | undefined;
  try {
    const body = await request.json();
    DNI = body?.DNI;
    password = body?.password;
  } catch (err) {
    console.warn('LOGIN: request.json() falló o body vacío/no JSON válido', err);
    return NextResponse.json({ message: 'Se requiere un cuerpo JSON con DNI y password' }, { status: 400 });
  }

  if (!DNI || !password) {
    return NextResponse.json({ message: 'Se requieren DNI y password' }, { status: 400 });
  }

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
