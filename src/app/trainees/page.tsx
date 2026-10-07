"use client";

import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";

export default function TraineesPage() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Trainees"
        description="Manage trainees, identity documents, and photos."
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Trainee
          </Button>
        }
      />

      <EmptyState
        icon={Users}
        title="No trainees registered"
        description="Add your first trainee to begin tracking identity documents, training sessions, and competencies."
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Register Trainee
          </Button>
        }
      />
    </div>
  );
}
