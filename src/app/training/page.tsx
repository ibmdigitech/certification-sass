"use client";

import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { GraduationCap, Plus } from "lucide-react";

export default function TrainingPage() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Training Programs"
        description="Manage training programs, courses, modules, and lessons."
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Program
          </Button>
        }
      />

      <EmptyState
        icon={GraduationCap}
        title="No training programs yet"
        description="Create your first training program to start managing courses, modules, and lessons."
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Training Program
          </Button>
        }
      />
    </div>
  );
}
