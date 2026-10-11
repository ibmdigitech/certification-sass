"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface BulkFile {
  id: string;
  file: File;
  status: 'PENDING' | 'UPLOADING' | 'EXTRACTING' | 'READY' | 'REVIEW' | 'LOW_CONFIDENCE' | 'FAILED';
  progress: number;
  extractedData?: any;
  error?: string;
}

export function BulkDocumentUploader() {
  const [files, setFiles] = useState<BulkFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'PENDING' as const,
      progress: 0,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [], 'application/pdf': [] } });

  const startUpload = async () => {
    setIsProcessing(true);
    
    // Simulate bulk upload and processing
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'PENDING' && files[i].status !== 'FAILED') continue;

      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'UPLOADING', progress: 10 } : f));
      
      // Simulate network upload
      await new Promise(resolve => setTimeout(resolve, 500));
      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'EXTRACTING', progress: 50 } : f));
      
      // Simulate AI extraction
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Randomly assign states to simulate reality
      const rand = Math.random();
      let status: BulkFile['status'] = 'READY';
      if (rand > 0.8) status = 'REVIEW';
      else if (rand > 0.7) status = 'LOW_CONFIDENCE';
      else if (rand > 0.95) status = 'FAILED';

      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status, progress: 100 } : f));
    }

    setIsProcessing(false);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const stats = {
    total: files.length,
    ready: files.filter(f => f.status === 'READY').length,
    review: files.filter(f => f.status === 'REVIEW').length,
    lowConfidence: files.filter(f => f.status === 'LOW_CONFIDENCE').length,
    failed: files.filter(f => f.status === 'FAILED').length,
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <div className="p-4 bg-primary/10 rounded-full">
            <UploadCloud className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium mt-2">Drag & Drop Documents</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Upload Emirates IDs, Passports, Visas, Licenses, and photos in bulk.
          </p>
        </div>
      </div>

      {/* Queue View */}
      {files.length > 0 && (
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
            <h3 className="font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Upload Queue ({stats.total} files)
            </h3>
            
            <div className="flex gap-4 text-sm font-medium">
              <span className="text-green-500 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {stats.ready} Ready</span>
              <span className="text-amber-500 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> {stats.review + stats.lowConfidence} Review</span>
              <span className="text-red-500 flex items-center gap-1"><XCircle className="w-4 h-4" /> {stats.failed} Failed</span>
            </div>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto divide-y">
            {files.map(file => (
              <div key={file.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-background border rounded shrink-0">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 shrink-0">
                  {/* Status Indicator */}
                  <div className="w-32 flex items-center justify-end gap-2 text-sm">
                    {file.status === 'PENDING' && <span className="text-muted-foreground">Pending</span>}
                    {(file.status === 'UPLOADING' || file.status === 'EXTRACTING') && (
                      <span className="text-blue-500 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> 
                        {file.status === 'UPLOADING' ? 'Uploading' : 'Extracting...'}
                      </span>
                    )}
                    {file.status === 'READY' && <span className="text-green-500 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Ready</span>}
                    {file.status === 'REVIEW' && <span className="text-amber-500 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Needs Review</span>}
                    {file.status === 'LOW_CONFIDENCE' && <span className="text-orange-500 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Low Confidence</span>}
                    {file.status === 'FAILED' && <span className="text-red-500 flex items-center gap-1"><XCircle className="w-4 h-4" /> Failed</span>}
                  </div>
                  
                  {/* Progress Bar (only show during processing) */}
                  {(file.status === 'UPLOADING' || file.status === 'EXTRACTING') && (
                    <div className="w-24">
                      <Progress value={file.progress} className="h-2" />
                    </div>
                  )}

                  {/* Actions */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeFile(file.id)}
                    disabled={file.status === 'UPLOADING' || file.status === 'EXTRACTING'}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t bg-muted/10 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFiles([])} disabled={isProcessing}>
              Clear All
            </Button>
            <Button onClick={startUpload} disabled={isProcessing || files.filter(f => f.status === 'PENDING' || f.status === 'FAILED').length === 0}>
              {isProcessing ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Processing...</span>
              ) : 'Process Queue'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
