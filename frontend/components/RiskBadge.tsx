import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, AlertCircle, XCircle } from "lucide-react";

export type RiskLevel = "low" | "medium" | "high" | "critical";

interface RiskBadgeProps {
  level: RiskLevel;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function RiskBadge({ level, showIcon = true, size = "md" }: RiskBadgeProps) {
  const config = {
    low: {
      label: "Low",
      icon: CheckCircle,
      className: "bg-success/10 text-success border-success/20",
    },
    medium: {
      label: "Medium",
      icon: AlertCircle,
      className: "bg-warning/10 text-warning border-warning/20",
    },
    high: {
      label: "High",
      icon: AlertTriangle,
      className: "bg-warning/20 text-warning border-warning/30",
    },
    critical: {
      label: "Critical",
      icon: XCircle,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const { label, icon: Icon, className } = config[level];

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        className,
        sizeClasses[size]
      )}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      {label}
    </span>
  );
}
