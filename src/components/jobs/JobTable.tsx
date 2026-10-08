"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JobStatusBadge } from "./JobStatusBadge";
import { Calendar, User, Building2, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Job } from "@/types/job";
import { Button } from "@/components/ui/button";

interface JobTableProps {
  jobs: Job[];
  onEdit?: (job: Job) => void;
  onDelete?: (job: Job) => void;
  onView?: (job: Job) => void;
  onAssignEngineer?: (job: Job) => void;
  isLoading?: boolean;
}

export function JobTable({
  jobs,
  onEdit,
  onDelete,
  onView,
  onAssignEngineer,
  isLoading = false,
}: JobTableProps) {
  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Scheduled Date</TableHead>
            <TableHead>Engineer</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
              <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
              <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
              <TableCell><div className="h-6 w-24 bg-muted animate-pulse rounded-full" /></TableCell>
              <TableCell><div className="h-4 w-28 bg-muted animate-pulse rounded" /></TableCell>
              <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
              <TableCell className="text-right"><div className="h-8 w-8 bg-muted animate-pulse rounded mx-auto" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">No job orders found</h3>
        <p className="text-sm text-muted-foreground mt-1">Create your first job order to get started.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Job Number</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Scheduled Date</TableHead>
          <TableHead>Engineer</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.id}>
            <TableCell className="font-mono font-medium">{job.jobNumber}</TableCell>
            <TableCell>
              <div>
                <p className="font-medium">{job.customer?.contact || 'Unknown Customer'}</p>
                {job.customer?.email && (
                  <p className="text-sm text-muted-foreground">{job.customer.email}</p>
                )}
              </div>
            </TableCell>
            <TableCell>{job.type || '-'}</TableCell>
            <TableCell>
              <JobStatusBadge status={job.status} />
            </TableCell>
            <TableCell>
              {job.scheduledDate ? (
                <>
                  <Calendar className="inline h-4 w-4 text-muted-foreground mr-1" />
                  {format(new Date(job.scheduledDate), 'MMM d, yyyy')}
                </>
              ) : (
                <span className="text-muted-foreground">Not scheduled</span>
              )}
            </TableCell>
            <TableCell>
              {job.engineer ? (
                <>
                  <User className="inline h-4 w-4 text-muted-foreground mr-1" />
                  {job.engineer.name}
                </>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={() => onView?.(job)}>
                      View Details
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit?.(job)}>
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onAssignEngineer && (
                    <DropdownMenuItem onClick={() => onAssignEngineer?.(job)}>
                      Assign Engineer
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete?.(job)}
                      className="text-red-600 focus:text-red-600"
                    >
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}