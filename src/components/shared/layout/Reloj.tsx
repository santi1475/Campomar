"use client";

import { HomeIcon } from "lucide-react";
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

export const Reloj = () => {
  const timezone = "America/Lima";
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date(new Date().toLocaleString("en-US", { timeZone: timezone }))
      );
    }, 60000);

    return () => clearInterval(timer);
  }, [timezone]);

  const formattedDate = format(currentTime, "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: es,
  });
  const formattedTime = format(currentTime, "HH:mm", { locale: es });

  return (
    <div className="w-full h-full">
      <div className="h-2 bg-brandSecondary w-full"></div>
      <div className="w-full bg-white shadow-md">
        <div className="w-full flex justify-between items-center px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col">
            <span className="text-sm sm:text-base text-gray-600 mb-1 capitalize">
              {formattedDate}
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-gray-800">
              {formattedTime}
            </span>
          </div>
          <Link
            href={"/empleado"}
            className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
            aria-label="Ir a la página de empleado"
          >
            <HomeIcon size={32} strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </div>
  );
};
