import Link from "next/link";
import React from "react";
import { motion } from "framer-motion";

interface CardEmpleadoProps {
  texto: string;
  icono: React.ReactNode;
  direccion: string;
}

export const CardEmpleado = ({
  texto,
  icono,
  direccion,
}: CardEmpleadoProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -8 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="w-full max-w-sm mx-auto"
    >
      <Link
        href={`${direccion}`}
        className="block h-full w-full"
      >
        <motion.div 
          className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl h-[400px] flex flex-col justify-center items-center group relative"
          whileHover={{ backgroundColor: "#EBF8FF" }}
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-blue-100 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          />
          <div className="p-8 flex flex-col items-center text-center relative z-10">
            <motion.div
              className="mb-6 text-7xl text-blue-500 transition-all duration-300 group-hover:text-blue-600"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              {icono}
            </motion.div>
            <motion.h3 
              className="text-2xl font-bold text-gray-800 transition-all duration-300 group-hover:text-blue-700"
              whileHover={{ scale: 1.05 }}
            >
              {texto}
            </motion.h3>
          </div>
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
            initial={{ scaleX: 0 }}
            whileHover={{ scaleX: 1 }}
          />
        </motion.div>
      </Link>
    </motion.div>
  );
};

