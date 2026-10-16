"use client";

import { Camera } from "lucide-react";

export default function FieldDocumentCapturePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Document Capture</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Capture and upload trainee documents, IDs, and certificates from the field.
        </p>
      </div>

      <div className="flex items-center justify-center h-[400px] border border-dashed rounded-xl bg-muted/30">
        <div className="text-center space-y-3">
          <Camera className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <div>
            <p className="font-medium text-muted-foreground">Document Capture</p>
            <p className="text-sm text-muted-foreground/70">Camera-based document capture coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
