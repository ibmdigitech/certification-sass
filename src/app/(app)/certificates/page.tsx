"use client";

import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FileCheck2 } from "lucide-react";

export default function CertificatesPage() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Certificates"
        description="Manage training certificates, QR verification, and certificate lifecycle."
      />

      <EmptyState
        icon={FileCheck2}
        title="No certificates issued"
        description="Certificates are generated after a trainee successfully completes training assessments and receives competency approval."
      />
    </div>
  );
}
