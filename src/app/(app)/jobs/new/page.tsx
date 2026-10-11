import { PageHeader } from "@/components/ui/page-header";
import { JobOrderWizard } from "@/components/jobs/JobOrderWizard";

export default function NewJobPage() {
  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
      <PageHeader
        title="New Job Order"
        description="Create a parent Job Order and link training and/or inspection services."
      />
      <JobOrderWizard />
    </div>
  );
}
