"use client";

import { ListChecks, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InspectionChecklistsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inspection Checklists</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage Normal and Full checklists for each equipment type and certificate configuration.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Checklist
        </Button>
      </div>

      <div className="flex items-center justify-center h-[400px] border border-dashed rounded-xl bg-muted/30">
        <div className="text-center space-y-3">
          <ListChecks className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <div>
            <p className="font-medium text-muted-foreground">Inspection Checklists</p>
            <p className="text-sm text-muted-foreground/70">Normal &amp; Full checklist management coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
