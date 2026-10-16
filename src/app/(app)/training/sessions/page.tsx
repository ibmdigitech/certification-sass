"use client";

import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TrainingSessionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training Sessions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Schedule, manage, and track training sessions with trainer assignments and attendance.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Session
        </Button>
      </div>

      <div className="flex items-center justify-center h-[400px] border border-dashed rounded-xl bg-muted/30">
        <div className="text-center space-y-3">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <div>
            <p className="font-medium text-muted-foreground">Training Sessions</p>
            <p className="text-sm text-muted-foreground/70">Session scheduling and management coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
