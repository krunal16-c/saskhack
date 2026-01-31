import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
    const variantStyles = {
      default: "bg-card border-border",
      success: "bg-success/5 border-success/20",
      warning: "bg-warning/5 border-warning/20",
      danger: "bg-destructive/5 border-destructive/20",
      info: "bg-info/5 border-info/20",
    };
  
    const iconStyles = {
      default: "bg-primary/10 text-primary",
      success: "bg-success/10 text-success",
      warning: "bg-warning/10 text-warning",
      danger: "bg-destructive/10 text-destructive",
      info: "bg-info/10 text-info",
    };


  return (
    <div
      className={cn(
        "rounded-xl border p-6 transition-all hover:shadow-md",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p
                className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}

            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn("rounded-lg p-3", iconStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
