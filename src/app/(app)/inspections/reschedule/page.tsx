"use client";

import { RotateCcw } from "lucide-react";

export default function InspectionReschedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inspection Reschedule</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage reschedule requests, suggest new dates, and track approval status.
        </p>
      </div>

      <div className="flex items-center justify-center h-[400px] border border-dashed rounded-xl bg-muted/30">
        <div className="text-center space-y-3">
          <RotateCcw className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <div>
            <p className="font-medium text-muted-foreground">Reschedule Management</p>
            <p className="text-sm text-muted-foreground/70">Reschedule requests and approvals coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
