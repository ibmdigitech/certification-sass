"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InspectionReportCard } from "@/components/inspections/InspectionReportCard";
import { FailureWorkflowCard } from "@/components/inspections/FailureWorkflowCard";
import { TemplateSelector } from "@/components/inspections/TemplateSelector";
import { SignaturePad } from "@/components/inspections/SignaturePad";
import {
  ClipboardCheck,
  Plus,
  FileText,
  AlertTriangle,
  Download,
  CheckCircle,
  XCircle,
  Send,
  PenTool,
  Loader2,
} from "lucide-react";

interface Report {
  id: number;
  reportNumber: string;
  title: string;
  version: number;
  status: string;
  createdAt: string;
  job?: { jobNumber: string; customer?: { name: string } };
  inspection?: { createdAt: string };
  template?: { name: string };
  generator?: { name: string };
  reviewer?: { name: string };
  approver?: { name: string };
}

interface FailureWorkflow {
  id: number;
  title: string;
  type: string;
  status: string;
  priority: string;
  description?: string;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  dueDate?: string;
  createdAt: string;
  resolvedAt?: string;
  job?: { jobNumber: string; customer?: { name: string } };
  report?: { reportNumber: string; title: string };
  assignee?: { name: string };
  resolver?: { name: string };
  _count?: { steps: number };
}

interface Template {
  id: number;
  name: string;
  description?: string;
  type: string;
  isDefault: boolean;
  createdAt: string;
  creator?: { name: string };
}

const COMPANY_ID = 1;

export default function InspectionsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [workflows, setWorkflows] = useState<FailureWorkflow[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("reports");

  // Dialog states
  const [createReportOpen, setCreateReportOpen] = useState(false);
  const [createWorkflowOpen, setCreateWorkflowOpen] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  // Form states
  const [newReportTitle, setNewReportTitle] = useState("");
  const [newReportContent, setNewReportContent] = useState("");
  const [newWorkflowTitle, setNewWorkflowTitle] = useState("");
  const [newWorkflowType, setNewWorkflowType] = useState("");
  const [newWorkflowDescription, setNewWorkflowDescription] = useState("");
  const [newWorkflowPriority, setNewWorkflowPriority] = useState("medium");
  const [newWorkflowAssignedTo, setNewWorkflowAssignedTo] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [reportsRes, workflowsRes, templatesRes] = await Promise.all([
        fetch(`/api/inspections/reports?companyId=${COMPANY_ID}`),
        fetch(`/api/inspections/failure-workflows?companyId=${COMPANY_ID}`),
        fetch(`/api/inspections/templates?companyId=${COMPANY_ID}`),
      ]);

      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(data.reports || []);
      }
      if (workflowsRes.ok) {
        const data = await workflowsRes.json();
        setWorkflows(data.workflows || []);
      }
      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateReport = async () => {
    if (!newReportTitle.trim()) return;

    try {
      setActionLoading(true);
      const res = await fetch("/api/inspections/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: COMPANY_ID,
          jobId: 1,
          inspectionId: 1,
          templateId: selectedTemplateId,
          title: newReportTitle,
          content: newReportContent ? JSON.parse(newReportContent) : undefined,
          generatedBy: 1,
        }),
      });

      if (res.ok) {
        setCreateReportOpen(false);
        setNewReportTitle("");
        setNewReportContent("");
        setSelectedTemplateId(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error creating report:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGeneratePDF = async (reportId: number) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/inspections/reports/${reportId}/pdf?companyId=${COMPANY_ID}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inspection-report-${reportId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReview = async (reportId: number) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/inspections/reports/${reportId}/submit-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: COMPANY_ID, reviewedBy: 1 }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error submitting for review:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (reportId: number) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/inspections/reports/${reportId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: COMPANY_ID, approvedBy: 1 }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error approving report:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reportId: number) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/inspections/reports/${reportId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: COMPANY_ID, reviewedBy: 1 }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error rejecting report:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateFailureWorkflow = async (reportId: number) => {
    setSelectedReportId(reportId);
    setCreateWorkflowOpen(true);
  };

  const handleSubmitFailureWorkflow = async () => {
    if (!newWorkflowTitle.trim() || !selectedReportId) return;

    try {
      setActionLoading(true);
      const res = await fetch("/api/inspections/failure-workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: COMPANY_ID,
          reportId: selectedReportId,
          jobId: 1,
          type: newWorkflowType || "inspection_failure",
          title: newWorkflowTitle,
          description: newWorkflowDescription,
          priority: newWorkflowPriority,
          assignedTo: newWorkflowAssignedTo ? parseInt(newWorkflowAssignedTo) : undefined,
        }),
      });

      if (res.ok) {
        setCreateWorkflowOpen(false);
        setNewWorkflowTitle("");
        setNewWorkflowType("");
        setNewWorkflowDescription("");
        setNewWorkflowPriority("medium");
        setNewWorkflowAssignedTo("");
        setSelectedReportId(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error creating failure workflow:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveWorkflow = async (workflowId: number) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/inspections/failure-workflows/${workflowId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: COMPANY_ID,
          resolvedBy: 1,
          rootCause: "Root cause identified",
          correctiveAction: "Corrective action taken",
          preventiveAction: "Preventive action implemented",
        }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error resolving workflow:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/inspections/reports/${reportId}?companyId=${COMPANY_ID}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting report:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignatureSave = async (signatureData: string) => {
    if (!selectedReportId) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/inspections/reports/${selectedReportId}/signatures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: COMPANY_ID,
          userId: 1,
          role: "inspector",
          signatureData,
        }),
      });

      if (res.ok) {
        setSignatureOpen(false);
        setSelectedReportId(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error saving signature:", error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
        <PageHeader
          title="Inspections"
          description="View and manage inspection workflows."
        />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Inspections"
        description="View and manage inspection workflows, reports, and failure handling."
        action={
          <Button onClick={() => setCreateReportOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Inspection Report
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports">
            <FileText className="mr-2 h-4 w-4" />
            Reports ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="failure-workflows">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Failure Workflows ({workflows.length})
          </TabsTrigger>
          <TabsTrigger value="templates">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Templates ({templates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {reports.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No inspection reports found"
              description="Inspection reports will appear here once inspections are completed."
              action={
                <Button onClick={() => setCreateReportOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Report
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <InspectionReportCard
                  key={report.id}
                  report={report}
                  onGeneratePDF={handleGeneratePDF}
                  onSubmitReview={handleSubmitReview}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onDelete={handleDeleteReport}
                  onCreateFailureWorkflow={handleCreateFailureWorkflow}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="failure-workflows" className="space-y-4">
          {workflows.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No failure workflows found"
              description="Failure workflows will appear here when inspection failures are detected."
            />
          ) : (
            <div className="grid gap-4">
              {workflows.map((workflow) => (
                <FailureWorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onResolve={handleResolveWorkflow}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {templates.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No report templates found"
              description="Report templates will appear here once created."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {template.name}
                      {template.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {template.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{template.type}</Badge>
                      <span>Created: {new Date(template.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Report Dialog */}
      <Dialog open={createReportOpen} onOpenChange={setCreateReportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Inspection Report</DialogTitle>
            <DialogDescription>
              Create a new inspection report from a template or blank.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Report Title</Label>
              <Input
                id="title"
                value={newReportTitle}
                onChange={(e) => setNewReportTitle(e.target.value)}
                placeholder="Enter report title"
              />
            </div>

            {templates.length > 0 && (
              <TemplateSelector
                templates={templates}
                selectedTemplateId={selectedTemplateId || undefined}
                onSelect={setSelectedTemplateId}
              />
            )}

            <div className="space-y-2">
              <Label htmlFor="content">Report Content (JSON)</Label>
              <Textarea
                id="content"
                value={newReportContent}
                onChange={(e) => setNewReportContent(e.target.value)}
                placeholder='{"location": "...", "equipment": "..."}'
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateReportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateReport} disabled={!newReportTitle.trim() || actionLoading}>
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Failure Workflow Dialog */}
      <Dialog open={createWorkflowOpen} onOpenChange={setCreateWorkflowOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Failure Workflow</DialogTitle>
            <DialogDescription>
              Create a failure workflow to track and resolve inspection failures.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-title">Failure Title</Label>
              <Input
                id="workflow-title"
                value={newWorkflowTitle}
                onChange={(e) => setNewWorkflowTitle(e.target.value)}
                placeholder="Enter failure title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workflow-type">Failure Type</Label>
              <Select value={newWorkflowType} onValueChange={setNewWorkflowType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select failure type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equipment_failure">Equipment Failure</SelectItem>
                  <SelectItem value="safety_violation">Safety Violation</SelectItem>
                  <SelectItem value="compliance_issue">Compliance Issue</SelectItem>
                  <SelectItem value="quality_defect">Quality Defect</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workflow-priority">Priority</Label>
              <Select value={newWorkflowPriority} onValueChange={setNewWorkflowPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workflow-description">Description</Label>
              <Textarea
                id="workflow-description"
                value={newWorkflowDescription}
                onChange={(e) => setNewWorkflowDescription(e.target.value)}
                placeholder="Describe the failure..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateWorkflowOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitFailureWorkflow} disabled={!newWorkflowTitle.trim() || actionLoading}>
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
              Create Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog open={signatureOpen} onOpenChange={setSignatureOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Digital Signature</DialogTitle>
            <DialogDescription>
              Sign the inspection report digitally.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <SignaturePad
              onSave={handleSignatureSave}
              onCancel={() => setSignatureOpen(false)}
              signerName="Inspector"
              role="inspector"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}