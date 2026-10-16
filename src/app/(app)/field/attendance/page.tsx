"use client";

import { CheckCircle } from "lucide-react";

export default function FieldAttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Field Attendance</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Record and track trainee attendance for on-site field training sessions.
        </p>
      </div>

      <div className="flex items-center justify-center h-[400px] border border-dashed rounded-xl bg-muted/30">
        <div className="text-center space-y-3">
          <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <div>
            <p className="font-medium text-muted-foreground">Attendance Tracking</p>
            <p className="text-sm text-muted-foreground/70">Attendance management coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
