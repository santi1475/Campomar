"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useDashboard } from "./hooks/use-dashboard"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Datos mock para gráficos que aún no tienen API
const heatmapData = [
    { day: "Lun", "10-12": 45, "12-14": 120, "14-16": 80, "16-18": 60, "18-20": 150, "20-22": 180 },
    { day: "Mar", "10-12": 50, "12-14": 110, "14-16": 75, "16-18": 65, "18-20": 140, "20-22": 170 },
    { day: "Mié", "10-12": 55, "12-14": 125, "14-16": 85, "16-18": 70, "18-20": 160, "20-22": 190 },
    { day: "Jue", "10-12": 60, "12-14": 130, "14-16": 90, "16-18": 75, "18-20": 165, "20-22": 195 },
    { day: "Vie", "10-12": 70, "12-14": 140, "14-16": 95, "16-18": 85, "18-20": 200, "20-22": 250 },
    { day: "Sáb", "10-12": 80, "12-14": 160, "14-16": 110, "16-18": 100, "18-20": 220, "20-22": 280 },
    { day: "Dom", "10-12": 75, "12-14": 150, "14-16": 105, "16-18": 95, "18-20": 210, "20-22": 260 },
]

const paymentMethodsData = [
    { name: "Efectivo", value: 45, fill: "hsl(var(--chart-1))" },
    { name: "Yape", value: 35, fill: "hsl(var(--chart-2))" },
    { name: "Tarjeta", value: 20, fill: "hsl(var(--chart-3))" },
]

export function BusinessIntelligence() {
    const { data, loading, error } = useDashboard()

    const topSalesData = data?.charts.topSalesData || []
    const topDeletedData = data?.charts.topDeletedData || []
    const platoEstrella = data?.kpis.platoEstrella || "N/A"

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Cargando datos de inteligencia de negocio...</span>
            </div>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }
    return (
        <div className="space-y-6">
            {/* Heatmap */}
            <Card>
                <CardHeader>
                    <CardTitle>Mapa de Calor de Ventas</CardTitle>
                    <CardDescription>
                        Ventas por día de la semana y hora del día (S/.)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer
                        config={{
                            sales: {
                                label: "Ventas",
                                color: "hsl(var(--chart-1))",
                            },
                        }}
                        className="h-[400px]"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={heatmapData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="day" className="text-xs" />
                                <YAxis className="text-xs" />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Bar dataKey="10-12" stackId="a" fill="hsl(var(--chart-5))" />
                                <Bar dataKey="12-14" stackId="a" fill="hsl(var(--chart-1))" />
                                <Bar dataKey="14-16" stackId="a" fill="hsl(var(--chart-2))" />
                                <Bar dataKey="16-18" stackId="a" fill="hsl(var(--chart-3))" />
                                <Bar dataKey="18-20" stackId="a" fill="hsl(var(--chart-4))" />
                                <Bar dataKey="20-22" stackId="a" fill="hsl(var(--primary))" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
                <CardHeader>
                    <CardTitle>Desglose de Métodos de Pago</CardTitle>
                    <CardDescription>
                        Distribución de pagos por método (%)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer
                        config={{
                            value: {
                                label: "Porcentaje",
                            },
                        }}
                        className="h-[300px]"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentMethodsData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {paymentMethodsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <ChartTooltip content={<ChartTooltipContent />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Menu Engineering Matrix */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Top Ventas</CardTitle>
                        <CardDescription>Platos más vendidos del mes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={{
                                sales: {
                                    label: "Ventas",
                                    color: "hsl(var(--chart-2))",
                                },
                            }}
                            className="h-[300px]"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topSalesData.length > 0 ? topSalesData : [{ name: "Sin datos", sales: 0 }]} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis type="number" className="text-xs" />
                                    <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="sales" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Eliminados</CardTitle>
                        <CardDescription>Platos más eliminados del sistema</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={{
                                deletions: {
                                    label: "Eliminaciones",
                                    color: "hsl(var(--destructive))",
                                },
                            }}
                            className="h-[300px]"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topDeletedData.length > 0 ? topDeletedData : [{ name: "Sin datos", deletions: 0 }]} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis type="number" className="text-xs" />
                                    <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="deletions" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle>💡 Insight de Negocio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    {topSalesData.length > 0 && topDeletedData.length > 0 ? (
                        <>
                            <p>
                                <span className="font-semibold">{platoEstrella}</span> es el plato más vendido.
                                {topDeletedData.some(d => d.name === platoEstrella) && 
                                    ` También aparece entre los más eliminados.`
                                }
                                {topDeletedData.some(d => d.name === platoEstrella) && 
                                    " Esto puede indicar problemas en la cocina (demora, calidad) o posible fraude del personal."
                                }
                            </p>
                            <p className="text-muted-foreground">
                                Recomendación: Revisar tiempos de preparación y capacitar al personal de cocina.
                                Monitorear de cerca las eliminaciones de los platos más vendidos.
                            </p>
                        </>
                    ) : (
                        <p className="text-muted-foreground">
                            No hay datos suficientes para generar insights en este momento.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
