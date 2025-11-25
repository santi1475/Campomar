"use client";

import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEmpleadoStore } from "@/store/empleado";
import { useRouter } from "next/navigation";
import { empleados } from "@prisma/client";
import { useState } from "react";
import { Spinner } from "@/components/shared/ui/spinner";

const FormSchema = z.object({
  DNI: z
    .string()
    .min(1, "Ingresa tu DNI")
    .regex(/^\d+$/, "El DNI solo puede contener números")
    .length(8, "El DNI debe tener 8 dígitos"),
  password: z
    .string()
    .min(1, "Ingresa tu contraseña")
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
});

const LoginForm = () => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      DNI: "",
      password: "",
    },
  });

  const setEmpleado = useEmpleadoStore((state: any) => state.setEmpleado);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async ({ DNI, password }: z.infer<typeof FormSchema>) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ DNI, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        form.setError("DNI", {
          type: "manual",
          message: data.message || "DNI o contraseña incorrectos",
        });
        setIsLoading(false);
        return;
      }

      const empleado = data.empleado as empleados;

      localStorage.setItem("empleado", JSON.stringify(empleado));

      setEmpleado(empleado);

      if (empleado.TipoEmpleadoID === 3) {
        router.push("/superadmin");
      } else if (empleado.TipoEmpleadoID === 2) {
        router.push("/admin");
      } else {
        router.push("/empleado");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      form.setError("DNI", {
        type: "manual",
        message: "Ocurrió un error al intentar iniciar sesión",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        <div className="space-y-2 flex flex-col gap-y-4">
          <FormField
            control={form.control}
            name="DNI"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DNI</FormLabel>
                <FormControl>
                  <Input placeholder="Ingresa tu DNI" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Ingresa tu contraseña"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          className="w-full mt-6 bg-brandSecondary"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner size="medium" className="mr-2" />
              Iniciando sesión...
            </>
          ) : (
            "Iniciar sesión"
          )}
        </Button>
      </form>
      <div className="mx-auto my-4 flex w-full items-center justify-evenly before:mr-4 before:block before:h-px before:flex-grow before:bg-stone-400 after:ml-4 after:block after:h-px after:flex-grow after:bg-stone-400">
        o
      </div>
      <p className="text-center text-sm text-gray-600 mt-2">
        Si no tienes una cuenta, pídele al administrador que te cree una.
      </p>
    </Form>
  );
};

export default LoginForm;
