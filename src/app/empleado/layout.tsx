import EmpleadoLayoutWrapper from "@/components/shared/layout/EmpleadoLayout";
import { Logout } from "@/components/shared/auth/Logout";
import { Reloj } from "@/components/shared/layout/Reloj";
import Sesion from "@/components/shared/auth/Sesion";

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
