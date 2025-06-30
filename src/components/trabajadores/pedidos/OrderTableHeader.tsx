import { TableHead, TableRow } from "@/components/ui/table";

const OrderTableHeader = () => {
  return (
    <TableRow>
      <TableHead className="w-[100px]">ID</TableHead>
      <TableHead>Mesa(s)</TableHead>
      <TableHead>Platos</TableHead>
      <TableHead className="text-right">Total</TableHead>
      <TableHead className="hidden md:table-cell">Fecha</TableHead>
      <TableHead className="text-right">Acciones</TableHead>
    </TableRow>
  );
};

export default OrderTableHeader;

