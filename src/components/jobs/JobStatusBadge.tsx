"use client";

import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_COLORS, JOB_STATUS_LABELS, type JobStatus } from "@/types/job";

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
}

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  const normalized = (status || "NEW").toUpperCase() as JobStatus;
  const color = JOB_STATUS_COLORS[normalized] ?? "bg-gray-100 text-gray-800 border-gray-200";
  const label = JOB_STATUS_LABELS[normalized] ?? status;
  return (
    <Badge
      variant="outline"
      className={`${color} ${className || ''}`}
    >
      {label}
    </Badge>
  );
}