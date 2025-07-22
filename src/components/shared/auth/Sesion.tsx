"use client"

import { useState } from "react"
import { useEmpleadoStore } from "@/store/empleado"
import type { empleados } from "@prisma/client"
import { User, HelpCircle, Mail, Phone, IdCard, X, Hash} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const Sesion = () => {
  const empleado: empleados = useEmpleadoStore((state: any) => state.empleado)
  const [activePanel, setActivePanel] = useState<"none" | "profile" | "help">("none")

  const openProfile = () => setActivePanel("profile")
  const openHelp = () => setActivePanel("help")
  const closePanel = () => setActivePanel("none")

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="text-black hover:text-[#00631b] relative h-12 w-12 rounded-full">
            <Avatar className="h-12 w-12">
              <AvatarFallback>{empleado.Nombre ? empleado.Nombre.charAt(0) : ""}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{empleado.Nombre}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={openProfile}>
            <div className="flex items-center w-full text-black hover:text-[#00631b] transition-colors duration-200">
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={openHelp}>
            <div className="flex items-center w-full text-black hover:text-[#00631b] transition-colors duration-200">
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Ayuda</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Panel de Perfil (implementación personalizada) */}
      {activePanel === "profile" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="bg-background w-full max-w-md h-full overflow-auto animate-in slide-in-from-right">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold">Perfil de Empleado</h2>
                <Button variant="ghost" size="icon" onClick={closePanel}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 p-6 overflow-auto">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-24 w-24">
                      <AvatarFallback className="text-2xl text-black">
                        {empleado.Nombre ? empleado.Nombre.charAt(0) : ""}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-3 text-[#00631b]" />
                      <div>
                        <p className="text-sm text-muted-foreground ">Nombre</p>
                        <p className="font-medium text-black">{empleado.Nombre || "No disponible"}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center">
                      <IdCard className="h-5 w-5 mr-3 text-[#00631b]" />
                      <div>
                        <p className="text-sm text-muted-foreground">DNI</p>
                        <p className="font-medium text-black">{empleado.DNI || "No disponible"}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center">
                      <Hash className="h-5 w-5 mr-3 text-[#00631b]" />
                      <div>
                        <p className="text-sm text-muted-foreground">ID de Empleado</p>
                        <p className="font-medium text-black">{empleado.EmpleadoID}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t">
                <Button variant="outline" onClick={closePanel} className="w-full font-medium text-black">
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel de Ayuda (implementación personalizada) */}
      {activePanel === "help" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="bg-background w-full max-w-md h-full overflow-auto animate-in slide-in-from-right">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold">Centro de Ayuda</h2>
                <Button variant="ghost" size="icon" onClick={closePanel}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 p-6 overflow-auto">
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Gestión de Pedidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        Para crear un nuevo pedido, selecciona las mesas disponibles y agrega los platos desde el menú.
                        Puedes modificar las cantidades según sea necesario.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Mesas y Reservas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        Gestiona el estado de las mesas desde la pantalla principal. Las mesas ocupadas se muestran en
                        rojo, las disponibles en verde.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Soporte Técnico</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        Si encuentras algún problema con el sistema, contacta al equipo de soporte:
                      </p>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-[#00631b]" />
                          <span className="text-sm">santiguz1475@gmail.com</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-[#00631b]" />
                          <span className="text-sm">+51 971 993 048</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="p-6 border-t">
                <Button variant="outline" onClick={closePanel} className="w-full font-medium text-black">
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Sesion

