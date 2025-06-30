import EmpleadoLayoutWrapper from "@/components/trabajadores/EmpleadoLayout";
import { Logout } from "@/components/trabajadores/Logout";
import { Reloj } from "@/components/trabajadores/Reloj";
import Sesion from "@/components/trabajadores/Sesion";

interface EmpleadoLayoutProps {
  children: React.ReactNode;
}

const EmpleadoLayout = ({ children }: EmpleadoLayoutProps) => {
  return (
    <EmpleadoLayoutWrapper>
      <header>
        <Reloj />
      </header>
      <div className="w-full h-full flex justify-center">{children}</div>
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-4 px-6 flex justify-between items-center w-full">
        <Logout />
        <p className="text-sm text-gray-400">© 2024 Campomar</p>
        <Sesion />
    </footer>
    </EmpleadoLayoutWrapper>
  );
};

export default EmpleadoLayout;
