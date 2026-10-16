"use client";

import { CalendarDays } from "lucide-react";

export default function FieldTodayPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Today's Sessions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          View and manage all field training sessions scheduled for today.
        </p>
      </div>

      <div className="flex items-center justify-center h-[400px] border border-dashed rounded-xl bg-muted/30">
        <div className="text-center space-y-3">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <div>
            <p className="font-medium text-muted-foreground">Today's Field Sessions</p>
            <p className="text-sm text-muted-foreground/70">Daily session view coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
