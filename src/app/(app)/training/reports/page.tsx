"use client";

import { BarChart3 } from "lucide-react";

export default function TrainingReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Training Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate and view analytics reports for training progress, completion rates, and assessments.
        </p>
      </div>

      <div className="flex items-center justify-center h-[400px] border border-dashed rounded-xl bg-muted/30">
        <div className="text-center space-y-3">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <div>
            <p className="font-medium text-muted-foreground">Training Reports</p>
            <p className="text-sm text-muted-foreground/70">Reporting and analytics coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
