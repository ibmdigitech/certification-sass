"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, CheckCircle, Clock, AlertTriangle, User } from "lucide-react";
import { format } from "date-fns";

interface FailureWorkflowCardProps {
  workflow: {
    id: number;
    title: string;
    type: string;
    status: string;
    priority: string;
    description?: string;
    rootCause?: string;
    correctiveAction?: string;
    preventiveAction?: string;
    dueDate?: Date | string;
    createdAt: string | Date;
    resolvedAt?: Date | string;
    job?: { jobNumber: string; customer?: { name: string } };
    report?: { reportNumber: string; title: string };
    assignee?: { name: string };
    resolver?: { name: string };
    _count?: { steps: number };
  };
  onView?: (workflow: any) => void;
  onResolve?: (id: number) => void;
  onAssign?: (id: number) => void;
}

const statusColors: Record<string, string> = {
  open: "bg-red-100 text-red-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-orange-100 text-orange-800",
  low: "bg-blue-100 text-blue-800",
};

const statusLabels: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const priorityLabels: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function FailureWorkflowCard({
  workflow,
  onView,
  onResolve,
  onAssign,
}: FailureWorkflowCardProps) {
  const statusColor = statusColors[workflow.status] || "bg-gray-100 text-gray-800";
  const priorityColor = priorityColors[workflow.priority] || "bg-gray-100 text-gray-800";
  const statusLabel = statusLabels[workflow.status] || workflow.status;
  const priorityLabel = priorityLabels[workflow.priority] || workflow.priority;

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: workflow.priority === 'high' ? '#dc2626' : workflow.priority === 'medium' ? '#ea580c' : '#2563eb' }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <CardTitle className="text-lg font-medium">{workflow.title}</CardTitle>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView?.(workflow)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {workflow.status !== "resolved" && workflow.status !== "closed" && (
              <>
                <DropdownMenuItem onClick={() => onAssign?.(workflow.id)}>
                  <User className="mr-2 h-4 w-4" />
                  Assign
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onResolve?.(workflow.id)} className="text-green-600">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Resolve
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={statusColor}>
            {statusLabel}
          </Badge>
          <Badge variant="outline" className={priorityColor}>
            {priorityLabel} Priority
          </Badge>
          <Badge variant="outline">{workflow.type}</Badge>
        </div>

        {workflow.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{workflow.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          {workflow.job && <span>Job: {workflow.job.jobNumber}</span>}
          {workflow.job?.customer && <span>{workflow.job.customer.name}</span>}
          {workflow.report && <span>Report: {workflow.report.reportNumber}</span>}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Created: {format(new Date(workflow.createdAt), "MMM d, yyyy")}
          </span>
          {workflow.dueDate && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Due: {format(new Date(workflow.dueDate), "MMM d, yyyy")}
            </span>
          )}
          {workflow.resolvedAt && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" />
              Resolved: {format(new Date(workflow.resolvedAt), "MMM d, yyyy")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          {workflow.assignee && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Assigned: {workflow.assignee.name}
            </span>
          )}
          {workflow.resolver && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Resolved by: {workflow.resolver.name}
            </span>
          )}
          {workflow._count && (
            <span>{workflow._count.steps} steps</span>
          )}
        </div>

        {workflow.rootCause && (
          <div className="text-sm">
            <span className="font-medium">Root Cause: </span>
            <span className="text-muted-foreground">{workflow.rootCause}</span>
          </div>
        )}
        {workflow.correctiveAction && (
          <div className="text-sm">
            <span className="font-medium">Corrective Action: </span>
            <span className="text-muted-foreground">{workflow.correctiveAction}</span>
          </div>
        )}
        {workflow.preventiveAction && (
          <div className="text-sm">
            <span className="font-medium">Preventive Action: </span>
            <span className="text-muted-foreground">{workflow.preventiveAction}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}