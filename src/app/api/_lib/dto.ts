import { z } from "zod";
import { MesaEstado, PedidoEstado } from "@prisma/client";

export const PedidoEstadoSchema = z.nativeEnum(PedidoEstado);
export const MesaEstadoSchema = z.nativeEnum(MesaEstado);

export const LoginRequestSchema = z.object({
  DNI: z.string().min(1),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const CreatePedidoSchema = z.object({
  EmpleadoID: z.number().int().positive(),
  Fecha: z.coerce.date(),
  Total: z.number().optional(),
  ParaLlevar: z.boolean().optional(),
  idempotencyKey: z.string().uuid().optional(),
});
export type CreatePedido = z.infer<typeof CreatePedidoSchema>;

export const UpdatePedidoSchema = z.object({
  EmpleadoID: z.number().int().positive().optional(),
  Fecha: z.coerce.date().optional(),
  Total: z.number().optional(),
  Estado: PedidoEstadoSchema.optional(),
  TipoPago: z.number().int().nullable().optional(),
});
export type UpdatePedido = z.infer<typeof UpdatePedidoSchema>;

export const CreateMesaSchema = z.object({
  NumeroMesa: z.number().int().positive(),
  Estado: MesaEstadoSchema,
});
export type CreateMesa = z.infer<typeof CreateMesaSchema>;

export const UpdateMesaSchema = z.object({
  NumeroMesa: z.number().int().positive().optional(),
  Estado: MesaEstadoSchema,
});
export type UpdateMesa = z.infer<typeof UpdateMesaSchema>;

export const CreatePedidoMesaSchema = z.object({
  PedidoID: z.number().int().positive(),
  MesaID: z.number().int().positive(),
});
export type CreatePedidoMesa = z.infer<typeof CreatePedidoMesaSchema>;

export const CreateDetallePedidoSchema = z.object({
  PedidoID: z.number().int().positive(),
  PlatoID: z.number().int().positive(),
  Cantidad: z.number().int().positive(),
  ParaLlevar: z.boolean().default(false),
  PrecioUnitario: z.number().optional(),
});
export type CreateDetallePedido = z.infer<typeof CreateDetallePedidoSchema>;

export const UpdateDetallePedidoSchema = z.object({
  PlatoID: z.number().int().positive().optional(),
  Cantidad: z.number().int().positive().optional(),
  operacion: z.enum(["incrementar", "decrementar"]).optional(),
  cantidad: z.number().int().positive().optional(),
  usuarioId: z.number().int().positive().optional(),
});
export type UpdateDetallePedido = z.infer<typeof UpdateDetallePedidoSchema>;

export const CreatePlatoSchema = z.object({
  Descripcion: z.string().min(1),
  Precio: z.number().nonnegative(),
  CategoriaID: z.number().int().positive(),
  PrecioLlevar: z.number().nonnegative().optional().default(0),
});
export type CreatePlato = z.infer<typeof CreatePlatoSchema>;

export const UpdatePlatoSchema = CreatePlatoSchema;
export type UpdatePlato = z.infer<typeof UpdatePlatoSchema>;

export const CreateEmpleadoSchema = z.object({
  Nombre: z.string().min(1),
  TipoEmpleadoID: z.number().int().positive(),
  DNI: z.string().min(1),
  Password: z.string().min(1),
});
export type CreateEmpleado = z.infer<typeof CreateEmpleadoSchema>;

export const UpdateEmpleadoSchema = z.object({
  Nombre: z.string().min(1),
  TipoEmpleadoID: z.number().int().positive(),
  DNI: z.string().min(1),
  Password: z.string().min(1),
  Activo: z.boolean().optional(),
});
export type UpdateEmpleado = z.infer<typeof UpdateEmpleadoSchema>;

export const ComandaDetalleInputSchema = z.object({
  PlatoID: z.number().int().positive(),
  Cantidad: z.number().int().positive(),
  ParaLlevar: z.boolean().optional(),
});
export type ComandaDetalleInput = z.infer<typeof ComandaDetalleInputSchema>;

export const CreateComandaCocinaSchema = z.object({
  pedidoID: z.number().int().positive(),
  comentario: z.string().optional(),
  detalles: z.array(ComandaDetalleInputSchema).optional(),
});
export type CreateComandaCocina = z.infer<typeof CreateComandaCocinaSchema>;

export const MarcarImpresosSchema = z.object({
  detalleIds: z.array(z.number().int().positive()).min(1),
});
export type MarcarImpresos = z.infer<typeof MarcarImpresosSchema>;

export const CancelarPedidoSchema = z.object({
  usuarioCanceladorId: z.number().int().positive(),
});
export type CancelarPedido = z.infer<typeof CancelarPedidoSchema>;

export const DeleteDetalleSchema = z.object({
  usuarioId: z.number().int().positive().optional(),
});
export type DeleteDetalle = z.infer<typeof DeleteDetalleSchema>;

export async function parseJson<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string; details?: unknown }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, status: 400, message: "Se requiere un cuerpo JSON válido" };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      status: 400,
      message: "Validación fallida",
      details: result.error.flatten(),
    };
  }
  return { ok: true, data: result.data };
}
