"use client";

import { Eye } from "lucide-react";

export default function InspectionReviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inspection Review</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review inspection findings, approve or reject reports, and manage technical review workflow.
        </p>
      </div>

      <div className="flex items-center justify-center h-[400px] border border-dashed rounded-xl bg-muted/30">
        <div className="text-center space-y-3">
          <Eye className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <div>
            <p className="font-medium text-muted-foreground">Inspection Review Queue</p>
            <p className="text-sm text-muted-foreground/70">Review and approval workflows coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
