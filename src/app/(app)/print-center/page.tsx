import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/page-header";
import { PrintCenter } from "@/components/print/PrintCenter";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Print Center | Certificate Pro",
  description: "Generate and print certificates, timesheets, and reports in bulk.",
};

export default function PrintCenterPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader 
          title="Print Center" 
          description="Generate, download, and print certificates, timesheets, inspection reports, and full job packages."
        />
        <PrintCenter />
      </div>
    </AppShell>
  );
}
