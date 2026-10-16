import { PageHeader } from "@/components/ui/page-header";
import { BulkJobImporter } from "@/components/jobs/BulkJobImporter";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Import Jobs | Certificate Pro",
  description: "Create multiple jobs at once by uploading an Excel or CSV file.",
};

export default function BulkJobImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Bulk Job Import" 
        description="Upload an Excel or CSV file containing job details. The system will validate the rows and create jobs with unique job numbers automatically."
      />
      
      <div className="bg-card border rounded-xl p-6">
        <BulkJobImporter />
      </div>
    </div>
  );
}
