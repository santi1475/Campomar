import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type LucideIcon } from 'lucide-react'
import { cn } from "@/lib/utils"

interface StatCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    description?: string
    variant?: "default" | "destructive" | "warning" | "success"
}

export function StatCard({ title, value, icon: Icon, description, variant = "default" }: StatCardProps) {
    const variantStyles = {
        default: "border-primary/20 bg-primary/5",
        destructive: "border-destructive/20 bg-destructive/5",
        warning: "border-warning/20 bg-warning/5",
        success: "border-success/20 bg-success/5",
    }

    const iconStyles = {
        default: "text-primary",
        destructive: "text-destructive",
        warning: "text-warning",
        success: "text-success",
    }

    return (
        <Card className={cn("border-2", variantStyles[variant])}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className={cn("h-5 w-5", iconStyles[variant])} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold lg:text-3xl">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
