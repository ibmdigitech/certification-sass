"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileText, Download, Edit, Trash2, Eye, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface InspectionReportCardProps {
  report: {
    id: number;
    reportNumber: string;
    title: string;
    version: number;
    status: string;
    createdAt: string | Date;
    job?: { jobNumber: string; customer?: { name: string } };
    inspection?: { createdAt: string | Date };
    template?: { name: string };
    generator?: { name: string };
    reviewer?: { name: string };
    approver?: { name: string };
  };
  onView?: (report: any) => void;
  onEdit?: (report: any) => void;
  onDelete?: (id: number) => void;
  onGeneratePDF?: (id: number) => void;
  onSubmitReview?: (id: number) => void;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onCreateFailureWorkflow?: (id: number) => void;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  under_review: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  signed: "bg-purple-100 text-purple-800",
  failure_workflow: "bg-orange-100 text-orange-800",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  signed: "Signed",
  failure_workflow: "Failure Workflow",
};

export function InspectionReportCard({
  report,
  onView,
  onEdit,
  onDelete,
  onGeneratePDF,
  onSubmitReview,
  onApprove,
  onReject,
  onCreateFailureWorkflow,
}: InspectionReportCardProps) {
  const statusColor = statusColors[report.status] || "bg-gray-100 text-gray-800";
  const statusLabel = statusLabels[report.status] || report.status;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-medium">{report.title}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            v{report.version}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView?.(report)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onGeneratePDF?.(report.id)}>
              <FileText className="mr-2 h-4 w-4" />
              Generate PDF
            </DropdownMenuItem>
            {report.status === "draft" && (
              <>
                <DropdownMenuItem onClick={() => onEdit?.(report)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSubmitReview?.(report.id)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Submit for Review
                </DropdownMenuItem>
              </>
            )}
            {report.status === "under_review" && (
              <>
                <DropdownMenuItem onClick={() => onApprove?.(report.id)} className="text-green-600">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onReject?.(report.id)} className="text-red-600">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Reject
                </DropdownMenuItem>
              </>
            )}
            {report.status === "approved" && (
              <DropdownMenuItem onClick={() => onCreateFailureWorkflow?.(report.id)} className="text-orange-600">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Create Failure Workflow
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onDelete?.(report.id)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="font-medium">{report.reportNumber}</span>
          <Badge variant="outline" className={statusColor}>
            {statusLabel}
          </Badge>
          {report.job && (
            <span>Job: {report.job.jobNumber}</span>
          )}
          {report.job?.customer && (
            <span>{report.job.customer.name}</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Created: {format(new Date(report.createdAt), "MMM d, yyyy")}</span>
          {report.inspection && (
            <span>Inspection: {format(new Date(report.inspection.createdAt), "MMM d, yyyy")}</span>
          )}
          {report.template && (
            <span>Template: {report.template.name}</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {report.generator && <span>Inspector: {report.generator.name}</span>}
          {report.reviewer && <span>Reviewer: {report.reviewer.name}</span>}
          {report.approver && <span>Approver: {report.approver.name}</span>}
        </div>
      </CardContent>
    </Card>
  );
}