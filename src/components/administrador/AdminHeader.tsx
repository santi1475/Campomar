'use client'
import { Logout } from "@/components/trabajadores/Logout";


export function AdminHeader() {
  
  return (
    <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-2xl font-bold text-white mb-4 sm:mb-0">Panel de Administración</h1>
        <Logout />
      </div>
    </header>
  );
}

