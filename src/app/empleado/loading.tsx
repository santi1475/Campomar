import { Spinner } from "@/components/shared/ui/spinner";
import React from "react";

const loading = () => {
  return (
    <div className="flex items-center gap-3">
      <Spinner size="large" />
    </div>
  );
};

export default loading;
