import { Table, TableBody, TableHeader } from "@/components/ui/table";
import OrderTableHeader from "./OrderTableHeader";
import OrderTableBody from "./OrderTableBody";

const OrderTable = ({
  searchTerm,
  refreshKey,
}: {
  searchTerm: string;
  refreshKey: number;
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <OrderTableHeader />
        </TableHeader>
        <TableBody>
          <OrderTableBody searchTerm={searchTerm} refreshKey={refreshKey} />
        </TableBody>
      </Table>
    </div>
  );
};

export default OrderTable;

