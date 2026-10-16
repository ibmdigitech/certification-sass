"use client";

import { UserPlus } from "lucide-react";

export default function TrainingEnrollmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Training Enrollments</h1>
        <p className="text-muted-foreground text-sm mt-1">
          View and manage trainee enrollments across all active training courses.
        </p>
      </div>

      <div className="flex items-center justify-center h-[400px] border border-dashed rounded-xl bg-muted/30">
        <div className="text-center space-y-3">
          <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <div>
            <p className="font-medium text-muted-foreground">Enrollments</p>
            <p className="text-sm text-muted-foreground/70">Enrollment management coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
