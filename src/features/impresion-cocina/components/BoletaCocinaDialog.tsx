"use client";

import { useRef, useState } from "react";
import BoletaCocina from "@/features/impresion-cocina/components/ComandaCocina";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ShoppingCart } from "lucide-react";

export default function BoletaCocinaDialog({
  mesas,
  handleRealizarPedido,
  orderItems,
}: {
  mesas: any[];
  handleRealizarPedido: () => Promise<number | null>;
  orderItems: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [comentario, setComentario] = useState("");
  const [showComentarioInput, setShowComentarioInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleFinalizeAndPrint = async () => {
    setIsSubmitting(true);
    try {
      const pedidoID = await handleRealizarPedido();

      if (pedidoID) {
        const configResponse = await fetch("/api/tunel_print");
        if (!configResponse.ok) {
          throw new Error("No se pudo obtener la configuración de la impresora.");
        }
        const config = await configResponse.json();
        const printerUrl = config.valor; 

        if (!printerUrl) {
            throw new Error("La URL de la impresora no está configurada en la base de datos.");
        }

        const printResponse = await fetch(`${printerUrl}/print`, { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pedidoID, comentario }),
        });

        if (!printResponse.ok) {
          const errorData = await printResponse.json();
          throw new Error(errorData.message || "La impresora no respondió.");
        }
        
        console.log("Comanda enviada a la impresora.");
      } else {
        throw new Error("No se pudo crear el pedido, la impresión fue cancelada.");
      }

      setIsOpen(false);

    } catch (error) {
      console.error("Error en el proceso de finalizar e imprimir:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Ocurrió un error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            setIsOpen(true);
          }}
          disabled={orderItems.length === 0}
        >
          <ShoppingCart className="w-5 h-5 mr-2" /> Realizar Pedido
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Boleta de Cocina - Mesa(s){" "}
            {mesas.map((mesa) => mesa.NumeroMesa).join(", ")}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 max-h-[80vh] overflow-y-auto">
          <BoletaCocina
            ref={receiptRef}
            orderItems={orderItems}
            mesas={mesas}
            comentario={comentario}
          />
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {!showComentarioInput ? (
            <Button
              variant="secondary"
              onClick={() => setShowComentarioInput(true)}
            >
              Agregar instrucción para cocina
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <textarea
                className="border rounded p-2 w-full"
                rows={2}
                placeholder="Escribe una instrucción para la cocina..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setComentario("");
                    setShowComentarioInput(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowComentarioInput(false)}
                  disabled={comentario.trim() === ""}
                >
                  Guardar instrucción
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cerrar
          </Button>
          <Button
            onClick={handleFinalizeAndPrint}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Procesando..." : "Finalizar e Imprimir"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
