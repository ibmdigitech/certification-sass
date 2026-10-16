import { PageHeader } from "@/components/ui/page-header";
import { BulkDocumentUploader } from "@/components/documents/BulkDocumentUploader";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bulk Document Upload | Certificate Pro",
  description: "Upload and process multiple trainee documents automatically.",
};

export default function BulkUploadPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Bulk Document Upload" 
        description="Upload Emirates IDs, Passports, Visas, and other documents. The AI will automatically extract data and match them to jobs or trainees."
      />
      
      <div className="bg-card border rounded-xl p-6">
        <BulkDocumentUploader />
      </div>
    </div>
  );
}
