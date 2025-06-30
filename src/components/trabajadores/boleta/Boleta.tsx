"use client";

import { useState, useEffect, forwardRef } from "react";
import { useSearchParams } from "next/navigation";

interface DetailItem {
  Producto: string;
  Cantidad: number;
  PrecioUnitario: number;
  Subtotal: string;
}

interface ReceiptData {
  PedidoID: number;
  Empleado: string;
  Fecha: string;
  Detalles: DetailItem[];
  Total: string;
  TipoPago: string;
}

interface CampomarReceiptProps {
  pedidoID?: string;
  tipoPago?: number | null;
}

const CampomarReceipt = forwardRef<HTMLDivElement, CampomarReceiptProps>(
  (props, ref) => {
    const [receipt, setReceipt] = useState<ReceiptData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const searchParams = useSearchParams();
    const pedidoID = props.pedidoID || searchParams.get("pedidoID");

    useEffect(() => {
      if (!pedidoID) {
        setError("No se proporcionó un ID de pedido");
        setLoading(false);
        return;
      }

      fetch(`/api/boleta?pedidoID=${pedidoID}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Error al obtener los datos del pedido");
          }
          return response.json();
        })
        .then((data) => {
          setReceipt(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }, [pedidoID]);

    if (loading) {
      return (
        <div className="flex justify-center items-center h-full">
          Cargando...
        </div>
      );
    }

    if (error) {
      return <div className="text-red-500 text-center">{error}</div>;
    }

    if (!receipt) {
      return (
        <div className="text-center">No se encontraron datos del pedido</div>
      );
    }

    return (
      <div
        ref={ref}
        className="max-w-md mx-auto my-8 p-6 bg-white shadow-lg rounded-lg"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Restaurante Campomar Criollo</h1>
          <p className="text-sm text-gray-600">Boleta de Venta</p>
        </div>

        <div className="mb-4">
          <p>
            <strong>Pedido N°:</strong> {receipt.PedidoID}
          </p>
          <p>
            <strong>Fecha:</strong> {new Date(receipt.Fecha).toLocaleString()}
          </p>
          <p>
            <strong>Atendido por:</strong> {receipt.Empleado}
          </p>
        </div>

        <table className="w-full mb-4">
          <thead>
            <tr className="border-b">
              <th className="text-left">Producto</th>
              <th className="text-right">Cant.</th>
              <th className="text-right">P.U.</th>
              <th className="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {receipt.Detalles.map((item, index) => (
              <tr key={index} className="border-b">
                <td>{item.Producto}</td>
                <td className="text-right">{item.Cantidad}</td>
                <td className="text-right">
                  S/ {Number(item.PrecioUnitario).toFixed(2)}
                </td>
                <td className="text-right">S/ {item.Subtotal}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right mb-4">
          <p>
            <strong>Total:</strong> S/ {receipt.Total}
          </p>
        </div>

        <div className="text-center text-sm">
          <p>
            <strong>Forma de Pago:</strong>{" "}
            {props.tipoPago === 1
              ? "Efectivo"
              : props.tipoPago === 2
              ? "Yape"
              : "POS"}
          </p>
          <p className="mt-4">¡Gracias por su preferencia!</p>
        </div>
      </div>
    );
  }
);

CampomarReceipt.displayName = "CampomarReceipt";

export default CampomarReceipt;
