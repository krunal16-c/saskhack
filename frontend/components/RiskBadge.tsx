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
      className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    },
    medium: {
      label: "Medium",
      icon: AlertCircle,
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    high: {
      label: "High",
      icon: AlertTriangle,
      className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    },
    critical: {
      label: "Critical",
      icon: XCircle,
      className: "bg-red-500/10 text-red-600 border-red-500/20",
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
