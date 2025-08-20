import { Table, TableBody, TableHeader } from "@/components/ui/table";
import OrderTableHeader from "./OrderTableHeader";
import OrderTableBody from "./OrderTableBody";

const OrderTable = ({
  searchTerm,
  refreshKey,
  onDataMutation,
}: {
  searchTerm: string;
  refreshKey: number;
  onDataMutation: () => void;
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <OrderTableHeader />
        </TableHeader>
        <TableBody>
          <OrderTableBody searchTerm={searchTerm} refreshKey={refreshKey} onDataMutation={onDataMutation} />
        </TableBody>
      </Table>
    </div>
  );
};

export default OrderTable;

