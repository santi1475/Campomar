"use client";

import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import BoletaCocina from "@/features/impresion-cocina/components/ComandaCocina"; // Asegúrate de importar el componente correcto
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
  handleRealizarPedido: () => void;
  orderItems: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [comentario, setComentario] = useState(""); // Estado para el comentario
  const [showComentarioInput, setShowComentarioInput] = useState(false); // Mostrar input
  const receiptRef = useRef<HTMLDivElement>(null);

  // Configuración de impresión
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Boleta-Cocina`,
    onAfterPrint: () => console.log("Impresión completada."),
  });

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
          {/* Boleta de Cocina */}
          <BoletaCocina
            ref={receiptRef}
            orderItems={orderItems}
            mesas={mesas}
            comentario={comentario}
          />
        </div>
        {/* Botón para mostrar input de comentario */}
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
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cerrar
          </Button>
          <Button
            onClick={() => {
              handlePrint && handlePrint();
              handleRealizarPedido();
              setIsOpen(false);
            }}
          >
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
