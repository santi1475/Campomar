import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Ordenamiento personalizado de platos por categoría.
// Orden: Caldos (4), Porciones (3), Bebidas (2), Criollo (1), Extras/Otros (5), luego cualquier otra.
import type { platos } from "@prisma/client";

export const ordenarPlatosPorCategoria = <T extends Pick<platos, 'CategoriaID'>>(lista: T[]): T[] => {
  const ordenCategorias = [4, 3, 2, 6, 7, 1, 8];
  return [...lista].sort((a, b) => {
    const indexA = ordenCategorias.indexOf(a.CategoriaID);
    const indexB = ordenCategorias.indexOf(b.CategoriaID);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1; // a va al final
    if (indexB === -1) return -1; // b va al final
    return indexA - indexB;
  });
};
