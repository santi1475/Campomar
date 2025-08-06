import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import * as yup from "yup";

export async function GET(req: Request) {
  try {
    const printerConfig = await prisma.configuracion.findUnique({
      where: {
        nombre_setting: "printer_url",
      },
    });

    if (!printerConfig) {
      return NextResponse.json(
        { error: "No se encontró la configuración de la impresora." },
        { status: 404 }
      );
    }

    return NextResponse.json(printerConfig);
  } catch (error) {
    console.error("Error al obtener la configuración:", error);
    return NextResponse.json(
      { error: "No se pudo obtener la configuración." },
      { status: 500 }
    );
  }
}

const postSchema = yup.object({
  valor: yup.string().url("Debe ser una URL válida").required("La URL es requerida"),
});


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { valor } = await postSchema.validate(body);

    const updatedConfig = await prisma.configuracion.upsert({
      where: { nombre_setting: "printer_url" },
      update: { valor: valor },
      create: { id: 1, nombre_setting: "printer_url", valor: valor },
    });

    return NextResponse.json(updatedConfig);
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error al actualizar la configuración:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar la configuración." },
      { status: 500 }
    );
  }
}
