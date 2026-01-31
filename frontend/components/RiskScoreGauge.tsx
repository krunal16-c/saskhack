"use client";

import { cn } from "@/lib/utils";

interface RiskScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
}

export function RiskScoreGauge({
  score,
  size = "md",
  showLabel = true,
  animated = true,
}: RiskScoreGaugeProps) {
  const getRiskLevel = (score: number) => {
    if (score <= 30) return "low";
    if (score <= 60) return "medium";
    if (score <= 85) return "high";
    return "critical";
  };

  const riskLevel = getRiskLevel(score);

  const sizeClasses = {
    sm: "w-16 h-16 text-lg",
    md: "w-24 h-24 text-2xl",
    lg: "w-32 h-32 text-3xl",
  };

  const riskColors = {
    low: "from-emerald-500 to-emerald-400 text-emerald-500",
    medium: "from-amber-500 to-yellow-400 text-amber-500",
    high: "from-orange-500 to-orange-400 text-orange-500",
    critical: "from-red-600 to-red-500 text-red-500",
  };

  const riskBgColors = {
    low: "bg-emerald-500/10",
    medium: "bg-amber-500/10",
    high: "bg-orange-500/10",
    critical: "bg-red-500/10",
  };

  const riskLabels = {
    low: "Low Risk",
    medium: "Medium Risk",
    high: "High Risk",
    critical: "Critical",
  };

  const circumference = 2 * Math.PI * 40;
  const strokeOffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn("relative", sizeClasses[size])}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="40%"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/30"
          />
          <circle
            cx="50%"
            cy="50%"
            r="40%"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={cn(
              "transition-all duration-1000",
              riskColors[riskLevel].split(" ")[0].replace("from-", "stroke-")
            )}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: animated ? strokeOffset : circumference,
            }}
          />
        </svg>
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center font-bold",
            riskColors[riskLevel].split(" ").pop()
          )}
        >
          {score}
        </div>
      </div>
      {showLabel && (
        <span
          className={cn(
            "text-sm font-medium px-3 py-1 rounded-full",
            riskBgColors[riskLevel],
            riskColors[riskLevel].split(" ").pop()
          )}
        >
          {riskLabels[riskLevel]}
        </span>
      )}
    </div>
  );
}
