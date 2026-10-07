"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

type AlertVariant = "info" | "success" | "warning" | "error";

const variantConfig: Record<AlertVariant, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: "border-blue-500/30 bg-blue-500/5 text-blue-400" },
  success: { icon: CheckCircle2, className: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" },
  warning: { icon: AlertTriangle, className: "border-amber-500/30 bg-amber-500/5 text-amber-400" },
  error: { icon: AlertCircle, className: "border-red-500/30 bg-red-500/5 text-red-400" },
};

interface AlertBannerProps {
  variant?: AlertVariant;
  title: string;
  description?: string;
  className?: string;
}

export function AlertBanner({ variant = "info", title, description, className }: AlertBannerProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-start gap-3 rounded-lg border p-4", config.className, className)}>
      <Icon className="h-5 w-5 mt-0.5 shrink-0" />
      <div>
        <p className="font-medium text-sm">{title}</p>
        {description && <p className="text-sm mt-1 opacity-80">{description}</p>}
      </div>
    </div>
  );
}
