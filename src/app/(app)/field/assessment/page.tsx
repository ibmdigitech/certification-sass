"use client";

import { ClipboardCheck } from "lucide-react";

export default function FieldAssessmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Field Assessment</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Conduct practical assessments and evaluations during on-site field training.
        </p>
      </div>

      <div className="flex items-center justify-center h-[400px] border border-dashed rounded-xl bg-muted/30">
        <div className="text-center space-y-3">
          <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <div>
            <p className="font-medium text-muted-foreground">Field Assessment</p>
            <p className="text-sm text-muted-foreground/70">Field assessment tools coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
