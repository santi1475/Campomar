"use client"

import { forwardRef } from "react"

interface BoletaCocinaProps {
  orderItems: {
    PlatoID: number
    Descripcion: string
    Cantidad: number
  }[]
  mesas: {
    NumeroMesa: number
  }[]
  comentario?: string // Nuevo: comentario opcional
}

const BoletaCocina = forwardRef<HTMLDivElement, BoletaCocinaProps>(({ orderItems, mesas, comentario }, ref) => {
  // Format current time
  const now = new Date()
  const timeString = now.toLocaleTimeString()
  const dateString = now.toLocaleDateString()

  return (
    <div
      ref={ref}
      className="p-6 bg-white shadow-lg rounded-lg border-2 border-gray-300 max-w-2xl mx-auto print:shadow-none print:border print:border-black"
    >
      {/* Header */}
      <h2 className="text-3xl font-extrabold mb-4 text-center uppercase border-b-2 border-black pb-2">
        Pedido
      </h2>

      {/* Time and Table info */}
      <div className="mb-6 text-xl">
        <p className="font-medium mb-2">
          <span className="font-bold">Fecha:</span> {dateString} - <span className="font-bold">Hora:</span> {timeString}
        </p>
        <p className="font-bold text-2xl bg-gray-100 p-2 rounded-md">
          Mesa(s): <span className="text-2xl">{mesas.map((mesa) => mesa.NumeroMesa).join(", ")}</span>
        </p>
      </div>

      {/* Order items */}
      <h3 className="text-xl font-bold mb-3 uppercase">Pedido:</h3>
      <ul className="space-y-3">
        {orderItems.map((item) => (
          <li key={item.PlatoID} className="flex justify-between items-center border-b-2 border-gray-200 py-3 text-xl">
            <span className="font-medium">{item.Descripcion}</span>
            <span className="font-extrabold text-2xl bg-gray-800 text-white px-4 py-1 rounded-full">
              {item.Cantidad}x
            </span>
          </li>
        ))}
      </ul>

      {/* Comentario para cocina */}
      {comentario && (
        <div className="mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded">
          <span className="font-bold">Instrucción para cocina:</span>
          <p className="mt-2 text-lg">{comentario}</p>
        </div>
      )}
    </div>
  )
})

BoletaCocina.displayName = "BoletaCocina"

export default BoletaCocina

