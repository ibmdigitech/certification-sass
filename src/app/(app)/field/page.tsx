"use client";

import { MapPin } from "lucide-react";

export default function FieldTrainingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Field Training</h1>
        <p className="text-muted-foreground text-sm mt-1">
          On-site training dashboard — manage field sessions, attendance, and document capture.
        </p>
      </div>

      <div className="flex items-center justify-center h-[400px] border border-dashed rounded-xl bg-muted/30">
        <div className="text-center space-y-3">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <div>
            <p className="font-medium text-muted-foreground">Field Training Dashboard</p>
            <p className="text-sm text-muted-foreground/70">Field operations management coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
