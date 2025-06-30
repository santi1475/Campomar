"use client";

import MesaLibre from "@/components/trabajadores/sala/MesaLibre";
import { MesaOcupada } from "@/components/trabajadores/sala/MesaOcupada";
import { empleados, mesas } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const MesaPage = () => {
  const searchParams = useSearchParams();

  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [mesas, setMesas] = useState<mesas[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const mesasParam = searchParams.get("mesas");
    if (mesasParam) {
      const mesasArray = mesasParam.split(",").map(Number);
      setSelectedTables(mesasArray);

      const fetchMesas = async () => {
        try {
          const mesaPromises = mesasArray.map((mesa) =>
            fetch(`/api/mesas/${mesa}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }).then((res) => {
              if (!res.ok) throw new Error("Error al obtener la mesa");
              return res.json();
            })
          );

          const mesaResults = await Promise.all(mesaPromises);
          setMesas(mesaResults); // Actualizar todas las mesas a la vez
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false); // Desactivar el estado de carga cuando se termine la petición
        }
      };

      fetchMesas();
    }
  }, [searchParams]);

  if (isLoading) {
    return <div>Cargando mesas...</div>;
  }

  const allTablesAreFree = mesas.every((table) => table.Estado === "Libre");

  return (
    <div>
      {allTablesAreFree ? <MesaLibre mesas={mesas} /> : <MesaOcupada />}
    </div>
  );
};

export default MesaPage;
