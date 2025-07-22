import axios from "axios";

export const fetchEarnings = async (
  startDate?: string,
  endDate?: string
): Promise<{
  earnings: number;
  earningsByPaymentType: {
    efectivo: number;
    yape: number;
    pos: number;
  };
}> => {
  const { data } = await axios.get("/api/dashboard/earnings", {
    params: { startDate, endDate },
  });

  // Aquí estamos retornando un objeto con los datos necesarios
  return {
    earnings: data.earnings,
    earningsByPaymentType: {
      efectivo: data.earningsByPaymentType.efectivo,
      yape: data.earningsByPaymentType.yape,
      pos: data.earningsByPaymentType.pos,
    },
  };
};

export const fetchTopSellingDishes = async (
  startDate?: string,
  endDate?: string
): Promise<{ dish: string; totalSold: number }[]> => {
  const { data } = await axios.get("/api/dashboard/top-dishes", {
    params: { startDate, endDate },
  });
  return data.topDishes;
};

export const fetchSalesByEmployee = async (
  startDate?: string,
  endDate?: string
): Promise<{ empleado: string; totalSold: number }[]> => {
  const { data } = await axios.get("/api/dashboard/employee-sales", {
    params: { startDate, endDate },
  });
  return data.salesByEmployee;
};
