"use client";

import React, { useState } from "react";
import { Printer, Download, Package, FileText, CheckCircle, AlertTriangle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface PrintJob {
  id: string;
  type: 'CERTIFICATE' | 'TIMESHEET' | 'REPORT' | 'PACKAGE';
  jobNumber: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  error?: string;
  createdAt: Date;
}

export function PrintCenter() {
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Simulated queue stats
  const stats = {
    total: printJobs.length,
    completed: printJobs.filter(j => j.status === 'COMPLETED').length,
    processing: printJobs.filter(j => j.status === 'PROCESSING').length,
    failed: printJobs.filter(j => j.status === 'FAILED').length,
    queued: printJobs.filter(j => j.status === 'QUEUED').length,
  };

  const addDemoJobs = () => {
    const demoJobs: PrintJob[] = Array.from({ length: 12 }, (_, i) => ({
      id: `pj-${Date.now()}-${i}`,
      type: (['CERTIFICATE', 'TIMESHEET', 'REPORT', 'PACKAGE'] as const)[i % 4],
      jobNumber: `TSC-${1000000 + i}`,
      status: 'QUEUED' as const,
      progress: 0,
      createdAt: new Date(),
    }));
    setPrintJobs(prev => [...prev, ...demoJobs]);
  };

  const processQueue = async () => {
    setIsGenerating(true);
    const pending = printJobs.filter(j => j.status === 'QUEUED' || j.status === 'FAILED');

    for (let i = 0; i < pending.length; i++) {
      const job = pending[i];

      // Set to processing
      setPrintJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'PROCESSING' as const, progress: 10 } : j));
      await new Promise(r => setTimeout(r, 300));

      // Progress updates
      setPrintJobs(prev => prev.map(j => j.id === job.id ? { ...j, progress: 50 } : j));
      await new Promise(r => setTimeout(r, 400));

      setPrintJobs(prev => prev.map(j => j.id === job.id ? { ...j, progress: 80 } : j));
      await new Promise(r => setTimeout(r, 200));

      // Final status
      const failed = Math.random() > 0.9;
      setPrintJobs(prev => prev.map(j => j.id === job.id ? {
        ...j,
        status: failed ? 'FAILED' as const : 'COMPLETED' as const,
        progress: 100,
        error: failed ? 'PDF generation timeout' : undefined,
      } : j));
    }

    setIsGenerating(false);
  };

  const retryFailed = () => {
    setPrintJobs(prev => prev.map(j => j.status === 'FAILED' ? { ...j, status: 'QUEUED' as const, progress: 0, error: undefined } : j));
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'CERTIFICATE': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'TIMESHEET': return <FileText className="w-4 h-4 text-green-500" />;
      case 'REPORT': return <FileText className="w-4 h-4 text-purple-500" />;
      case 'PACKAGE': return <Package className="w-4 h-4 text-amber-500" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'QUEUED': return <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Queued</span>;
      case 'PROCESSING': return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Processing</span>;
      case 'COMPLETED': return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Done</span>;
      case 'FAILED': return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1"><XCircle className="w-3 h-3" /> Failed</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground' },
          { label: 'Completed', value: stats.completed, color: 'text-green-500' },
          { label: 'Processing', value: stats.processing, color: 'text-blue-500' },
          { label: 'Queued', value: stats.queued, color: 'text-muted-foreground' },
          { label: 'Failed', value: stats.failed, color: 'text-red-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={addDemoJobs} variant="outline" className="flex items-center gap-2">
          <Printer className="w-4 h-4" /> Add Print Jobs
        </Button>
        <Button onClick={processQueue} disabled={isGenerating || stats.queued === 0} className="flex items-center gap-2">
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
          {isGenerating ? 'Processing...' : 'Process Queue'}
        </Button>
        {stats.failed > 0 && (
          <Button onClick={retryFailed} variant="outline" className="flex items-center gap-2 text-amber-600 border-amber-200">
            <RefreshCw className="w-4 h-4" /> Retry Failed ({stats.failed})
          </Button>
        )}
        {stats.completed > 0 && (
          <Button variant="outline" className="flex items-center gap-2 text-green-600 border-green-200">
            <Download className="w-4 h-4" /> Download All ({stats.completed})
          </Button>
        )}
      </div>

      {/* Overall progress */}
      {isGenerating && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Processing print queue...</span>
            <span>{stats.completed + stats.failed} / {stats.total}</span>
          </div>
          <Progress value={((stats.completed + stats.failed) / Math.max(stats.total, 1)) * 100} className="h-2" />
        </div>
      )}

      {/* Job list */}
      {printJobs.length > 0 && (
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="p-4 border-b bg-muted/30">
            <h3 className="font-medium">Print Queue</h3>
          </div>
          <div className="max-h-[500px] overflow-y-auto divide-y">
            {printJobs.map(job => (
              <div key={job.id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  {typeIcon(job.type)}
                  <div>
                    <div className="text-sm font-medium">{job.jobNumber}</div>
                    <div className="text-xs text-muted-foreground">{job.type}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {(job.status === 'PROCESSING') && (
                    <div className="w-20">
                      <Progress value={job.progress} className="h-1.5" />
                    </div>
                  )}
                  {statusBadge(job.status)}
                  {job.error && (
                    <span className="text-xs text-red-500 max-w-[150px] truncate" title={job.error}>
                      {job.error}
                    </span>
                  )}
                  {job.status === 'COMPLETED' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {printJobs.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Printer className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No print jobs in the queue</p>
          <p className="text-sm mt-1">Add certificates, timesheets, or reports to start printing.</p>
        </div>
      )}
    </div>
  );
}
