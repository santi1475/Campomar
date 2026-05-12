import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const BCRYPT_SALT_ROUNDS = 10;
const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$/;

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
    const empleado = await prisma.empleados.findUnique({
      where: { DNI },
    });

    if (!empleado || !empleado.Password) {
      return NextResponse.json({ message: 'Credenciales incorrectas' }, { status: 401 });
    }

    const stored = empleado.Password;
    const isBcryptHash = BCRYPT_HASH_REGEX.test(stored);

    let passwordOk = false;
    if (isBcryptHash) {
      passwordOk = await bcrypt.compare(password, stored);
    } else {
      // Lazy migration: legacy plaintext row. Validate, then upgrade to bcrypt.
      passwordOk = stored === password;
      if (passwordOk) {
        const newHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        await prisma.empleados.update({
          where: { EmpleadoID: empleado.EmpleadoID },
          data: { Password: newHash },
        });
      }
    }

    if (!passwordOk) {
      return NextResponse.json({ message: 'Credenciales incorrectas' }, { status: 401 });
    }

    if (!empleado.Activo) {
      return NextResponse.json({ message: 'Este usuario ha sido deshabilitado.' }, { status: 403 });
    }

    const { Password: _omit, ...empleadoSafe } = empleado;
    return NextResponse.json({ message: 'Inicio de sesión exitoso', empleado: empleadoSafe });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
