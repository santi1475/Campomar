import prisma from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { PedidoEstado, Prisma } from "@prisma/client";
import * as yup from "yup";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

function parsePedidoEstado(value: string | null): PedidoEstado | undefined {
  if (value === null) return undefined;
  if (value === "Activo" || value === "Cerrado") return value;
  if (value === "true") return PedidoEstado.Activo;
  if (value === "false") return PedidoEstado.Cerrado;
  return undefined;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const estadoParam = searchParams.get("Estado");
  const paraLlevarParam = searchParams.get("ParaLlevar");
  const takeParam = searchParams.get("take");
  const skipParam = searchParams.get("skip");
  const cursorParam = searchParams.get("cursor");

  const where: Prisma.pedidosWhereInput = {};

  const estado = parsePedidoEstado(estadoParam);
  if (estado !== undefined) where.Estado = estado;
  if (paraLlevarParam !== null) where.ParaLlevar = paraLlevarParam === "true";

  const takeRaw = takeParam ? Number.parseInt(takeParam, 10) : DEFAULT_PAGE_SIZE;
  const take =
    Number.isFinite(takeRaw) && takeRaw > 0
      ? Math.min(takeRaw, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  const skipRaw = skipParam ? Number.parseInt(skipParam, 10) : 0;
  const skip = Number.isFinite(skipRaw) && skipRaw >= 0 ? skipRaw : 0;

  const cursorRaw = cursorParam ? Number.parseInt(cursorParam, 10) : NaN;
  const useCursor = Number.isFinite(cursorRaw) && cursorRaw > 0;

  try {
    const pedidos = await prisma.pedidos.findMany({
      where,
      take,
      ...(useCursor
        ? { cursor: { PedidoID: cursorRaw }, skip: 1 }
        : { skip }),
      orderBy: { PedidoID: "desc" },
    });

    const nextCursor =
      pedidos.length === take ? pedidos[pedidos.length - 1].PedidoID : null;

    return NextResponse.json({
      data: pedidos,
      pagination: { take, skip: useCursor ? null : skip, nextCursor },
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Error al obtener los pedidos", error },
      { status: 500 }
    );
  }
}

const postSchema = yup.object({
  EmpleadoID: yup.number().required(),
  Fecha: yup.date().required(),
  Total: yup.number().optional(),
  ParaLlevar: yup.boolean().optional(),
  idempotencyKey: yup.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { EmpleadoID, Fecha, Total, ParaLlevar, idempotencyKey } =
      await postSchema.validate(await req.json());

    if (idempotencyKey) {
      const existing = await prisma.pedidos.findUnique({
        where: { IdempotencyKey: idempotencyKey },
      });
      if (existing) {
        return NextResponse.json(existing, { status: 200 });
      }
    }

    try {
      const pedido = await prisma.pedidos.create({
        data: {
          EmpleadoID,
          Fecha,
          Total: Total ?? 0,
          ParaLlevar: ParaLlevar ?? false,
          IdempotencyKey: idempotencyKey ?? null,
        },
      });
      return NextResponse.json(pedido, { status: 201 });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        idempotencyKey
      ) {
        const existing = await prisma.pedidos.findUnique({
          where: { IdempotencyKey: idempotencyKey },
        });
        if (existing) return NextResponse.json(existing, { status: 200 });
      }
      throw err;
    }
  } catch (error) {
    return NextResponse.json(error, { status: 400 });
  }
}
