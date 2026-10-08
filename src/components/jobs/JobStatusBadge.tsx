"use client";

import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_COLORS, JOB_STATUS_LABELS, type JobStatus } from "@/types/job";

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
}

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`${JOB_STATUS_COLORS[status]} ${className || ''}`}
    >
      {JOB_STATUS_LABELS[status]}
    </Badge>
  );
}