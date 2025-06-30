"use client";

import { useRef, useState } from "react";
import CampomarReceipt from "@/components/trabajadores/boleta/Boleta";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { ModalConfirm } from "./ModalConfirm";

export default function BoletaTotal({
  pedidoID,
  onFinishOrder,
  buttonColor,
  tipoPago,
}: {
  pedidoID: string;
  onFinishOrder: () => void;
  buttonColor: string;
  tipoPago: number | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirm = () => {
    onFinishOrder();
    setShowConfirm(false);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className={buttonColor} disabled={tipoPago === null}>
          <Check className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Boleta del Pedido {pedidoID}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 max-h-[80vh] overflow-y-auto">
          {/* Referencia al contenido de la boleta */}
          <CampomarReceipt
            ref={receiptRef}
            pedidoID={pedidoID}
            tipoPago={tipoPago}
          />
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cerrar
          </Button>
          <Button
            variant="default"
            onClick={() => setShowConfirm(true)}
            disabled={tipoPago === null}
          >
            Confirmar
          </Button>
        </div>
      </DialogContent>
      <ModalConfirm
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        message="¿Estás seguro de finalizar el pedido?"
      />
    </Dialog>
  );
}
