import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Check, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BoletaTotal from "../boleta/BoletaTotal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import qrCode from "@/assets/OIP.jpg";

const OrderRow = ({
  order,
  onFinishOrder,
  onViewOrder,
  onTipoPagoChange,
  tipoPago,
}: {
  order: {
    id: string;
    table: string;
    items: number;
    total: number;
    time: string;
    date: string;
  };
  onFinishOrder: () => void;
  onViewOrder: () => void;
  onTipoPagoChange: (value: number | null) => void;
  tipoPago: number | null;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTipoPagoChange = (value: number | null) => {
    onTipoPagoChange(value);
    if (value === 2) {
      setIsModalOpen(true);
    }
  };

  const buttonColor = (() => {
    switch (tipoPago) {
      case 1:
        return "bg-[#00631b] hover:bg-[#00631b]/90";
      case 2:
        return "bg-[#931194] hover:bg-[#931194]/90";
      case 3:
        return "bg-[#f7762c] hover:bg-[#f7762c]/90";
      default:
        return "";
    }
  })();

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{order.id}</TableCell>
        <TableCell>{order.table}</TableCell>
        <TableCell>{order.items}</TableCell>
        <TableCell className="text-right">S/. {Number(order.total).toFixed(2)}</TableCell>
        <TableCell className="hidden md:table-cell">{`${order.date} ${order.time}`}</TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end items-center space-x-2">
            <Button size="sm" variant="outline" onClick={onViewOrder}>
              <Eye className="w-4 h-4" />
              <span className="sr-only">Ver</span>
            </Button>

            <Select onValueChange={(value) => handleTipoPagoChange(Number(value))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Efectivo</SelectItem>
                <SelectItem value="2">Yape</SelectItem>
                <SelectItem value="3">POS</SelectItem>
              </SelectContent>
            </Select>

            <BoletaTotal
              pedidoID={order.id}
              onFinishOrder={onFinishOrder}
              buttonColor={buttonColor}
              tipoPago={tipoPago}
            />
          </div>
        </TableCell>
      </TableRow>

      {/* Modal para Yape */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-sm mx-auto bg-white p-4 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Escanea para pagar con Yape</DialogTitle>
          </DialogHeader>
            <div className="flex flex-col items-center">
            <Image src={qrCode} alt="Código QR de Yape" width={224} height={224} className="object-cover" />
            <Button className="mt-4 bg-red-500 hover:bg-red-600 text-white" onClick={() => setIsModalOpen(false)}>
              <X className="w-4 h-4 mr-2" /> Cerrar
            </Button>
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderRow;
