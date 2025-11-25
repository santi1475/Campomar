"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/features/superAdmin/stat-card"
import { SecurityAlertsTable } from "@/features/superAdmin/security-alerts-table"
import { EmployeeScorecard } from "@/features/superAdmin/employee-scorecard"
import { BusinessIntelligence } from "@/features/superAdmin/business-intelligence"
import { useDashboard } from "@/features/superAdmin/hooks/use-dashboard"
import { useEmployees } from "@/features/superAdmin/hooks/use-employees"
import { AlertTriangle, DollarSign, Users, Shield, TrendingUp, BarChart3 } from 'lucide-react'

export default function AuditDashboard() {
    const [activeTab, setActiveTab] = useState("security")
    const { data: dashboardData, loading: dashboardLoading } = useDashboard()
    const { employees } = useEmployees()

    // Encontrar el empleado con más eliminaciones sospechosas
    const mostSuspiciousEmployee = useMemo(() => {
        if (!employees || employees.length === 0) return null
        return employees.reduce((prev, current) => 
            (current.suspiciousDeletions > prev.suspiciousDeletions) ? current : prev
        )
    }, [employees])

    // Formatear valores
    const formatCurrency = (value: number) => {
        return `S/. ${value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    const formatEmployeeName = (name: string) => {
        const parts = name.split(" ")
        return parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0]
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto px-4 py-4 lg:py-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold lg:text-3xl text-balance">
                                Centro de Control de Auditoría
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Sistema de seguridad y análisis comercial
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6 lg:py-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                        <TabsTrigger value="security" className="gap-2">
                            <Shield className="h-4 w-4" />
                            <span className="hidden sm:inline">Seguridad</span>
                        </TabsTrigger>
                        <TabsTrigger value="performance" className="gap-2">
                            <Users className="h-4 w-4" />
                            <span className="hidden sm:inline">Personal</span>
                        </TabsTrigger>
                        <TabsTrigger value="intelligence" className="gap-2">
                            <BarChart3 className="h-4 w-4" />
                            <span className="hidden sm:inline">Inteligencia</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Security Tab */}
                    <TabsContent value="security" className="space-y-6">
                        {/* KPI Cards */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <StatCard
                                title="Dinero 'Desaparecido'"
                                value={dashboardData?.kpis.dineroPerdido ? formatCurrency(dashboardData.kpis.dineroPerdido) : "Cargando..."}
                                icon={DollarSign}
                                description="Últimos 30 días"
                                variant="destructive"
                            />
                            <StatCard
                                title="Intentos de Fraude"
                                value={dashboardData?.kpis.intentosFraude?.toString() || "0"}
                                icon={AlertTriangle}
                                description="Eventos detectados"
                                variant="warning"
                            />
                            <StatCard
                                title="Mesero bajo Lupa"
                                value={mostSuspiciousEmployee && mostSuspiciousEmployee.suspiciousDeletions > 0 
                                    ? formatEmployeeName(mostSuspiciousEmployee.name)
                                    : "Ninguno"
                                }
                                icon={Users}
                                description={mostSuspiciousEmployee && mostSuspiciousEmployee.suspiciousDeletions > 0
                                    ? `${mostSuspiciousEmployee.suspiciousDeletions} eliminaciones sospechosas`
                                    : "Sin eliminaciones sospechosas"
                                }
                                variant={mostSuspiciousEmployee && mostSuspiciousEmployee.suspiciousDeletions > 0 ? "destructive" : "default"}
                            />
                        </div>

                        {/* Security Alerts Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-destructive" />
                                    Alertas de Seguridad
                                </CardTitle>
                                <CardDescription>
                                    Registro cronológico de eliminaciones sospechosas
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <SecurityAlertsTable />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Performance Tab */}
                    <TabsContent value="performance" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    Rendimiento y Confianza del Personal
                                </CardTitle>
                                <CardDescription>
                                    Evaluación 360° del empleado: producción vs. riesgo
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <EmployeeScorecard />
                            </CardContent>
                        </Card>

                        <Card className="bg-muted/50">
                            <CardHeader>
                                <CardTitle>📊 Análisis de Confianza</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                {(() => {
                                    const high = employees.filter(e => e.trustLevel === "high").length
                                    const medium = employees.filter(e => e.trustLevel === "medium").length
                                    const low = employees.filter(e => e.trustLevel === "low").length
                                    
                                    return (
                                        <>
                                            <p>
                                                <span className="font-semibold">🟢 Alto ({high} {high === 1 ? 'empleado' : 'empleados'}):</span> Sin eliminaciones sospechosas.
                                                Personal confiable con buen rendimiento.
                                            </p>
                                            <p>
                                                <span className="font-semibold">🟡 Medio ({medium} {medium === 1 ? 'empleado' : 'empleados'}):</span> 1-3 eliminaciones.
                                                Posibles errores humanos, requiere seguimiento.
                                            </p>
                                            <p>
                                                <span className="font-semibold">🔴 Bajo ({low} {low === 1 ? 'empleado' : 'empleados'}):</span> Más de 4 eliminaciones.
                                                Patrón de conducta sospechosa, requiere investigación inmediata.
                                            </p>
                                        </>
                                    )
                                })()}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Intelligence Tab */}
                    <TabsContent value="intelligence" className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            <StatCard
                                title="Ventas del Mes"
                                value={dashboardData?.kpis.ventasMes ? formatCurrency(dashboardData.kpis.ventasMes) : "Cargando..."}
                                icon={TrendingUp}
                                description="Este mes"
                                variant="success"
                            />
                            <StatCard
                                title="Ticket Promedio"
                                value={dashboardData?.kpis.ticketPromedio ? formatCurrency(dashboardData.kpis.ticketPromedio) : "Cargando..."}
                                icon={DollarSign}
                                description="Por mesa atendida"
                                variant="default"
                            />
                            <StatCard
                                title="Plato Estrella"
                                value={dashboardData?.kpis.platoEstrella || "N/A"}
                                icon={BarChart3}
                                description={dashboardData?.charts.topSalesData?.[0]?.sales 
                                    ? `${dashboardData.charts.topSalesData[0].sales} ventas este mes`
                                    : "Sin datos"
                                }
                                variant="success"
                            />
                        </div>

                        <BusinessIntelligence />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
