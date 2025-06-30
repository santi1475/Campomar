import {create} from "zustand";
import { empleados } from '@prisma/client';

export const useEmpleadoStore = create((set) => ({
  empleado: null as empleados | null,
  setEmpleado: (empleado: empleados) => set({ empleado }),
  logout: () => set({ empleado: null }),
}));