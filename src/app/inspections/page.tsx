"use client";

import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Plus } from "lucide-react";

export default function InspectionsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Inspections"
        description="View and manage inspection workflows."
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Inspection
          </Button>
        }
      />

      <EmptyState
        icon={ClipboardCheck}
        title="No inspections found"
        description="Inspections will appear here once the Training → Competency → Authorization workflow is complete."
      />
    </div>
  );
}
