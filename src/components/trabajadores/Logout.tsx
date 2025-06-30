"use client";

import { LogOut } from 'lucide-react';
import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Logout = () => {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("empleado");
    router.push("/login");
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:text-white hover:bg-gray-700 border border-gray-600 rounded-full"
              >
                <LogOut className="h-6 w-6 rotate-180" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro que deseas cerrar sesión?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción cerrará tu sesión actual y te redirigirá a la página de inicio de sesión.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>Cerrar Sesión</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TooltipTrigger>
        <TooltipContent>
          <p>Cerrar Sesión</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

