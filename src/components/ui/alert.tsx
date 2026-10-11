"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface AlertProps {
  variant?: "default" | "destructive";
  className?: string;
  children: React.ReactNode;
}

export function Alert({ variant = "default", className, children }: AlertProps) {
  const baseStyles = "relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg]:h-5 [&>svg]:w-5";
  const variantStyles = {
    default: "bg-background text-foreground",
    destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
  };

  return (
    <div className={cn(baseStyles, variantStyles[variant], className)}>
      {children}
    </div>
  );
}

interface AlertTitleProps {
  className?: string;
  children: React.ReactNode;
}

export function AlertTitle({ className, children }: AlertTitleProps) {
  return (
    <h5 className={cn("mb-1 font-medium leading-none", className)}>
      {children}
    </h5>
  );
}

interface AlertDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

export function AlertDescription({ className, children }: AlertDescriptionProps) {
  return (
    <div className={cn("text-sm [&_p]:leading-relaxed", className)}>
      {children}
    </div>
  );
}