"use client";

import { useState, useCallback } from 'react';
import { Search, Filter, Plus, ChevronDown, ChevronUp, MoreHorizontal, Eye, Edit, Trash2, FileText, GraduationCap, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';

export interface Trainee {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  employeeId: string | null;
  jobTitle: string | null;
  hireDate: string | null;
  status: string;
  createdAt: string;
  _count: {
    documents: number;
    trainingSessions: number;
  };
  documents: Array<{ id: number; type: string; status: string }>;
  trainingSessions: Array<{ id: number; sessionDate: string; training: { module: string | null } | null; status: string }>;
}

interface TraineeListingProps {
  initialTrainees?: Trainee[];
  onAddTrainee?: () => void;
  onViewTrainee?: (trainee: Trainee) => void;
  onEditTrainee?: (trainee: Trainee) => void;
  onDeleteTrainee?: (trainee: Trainee) => void;
  onViewDocuments?: (trainee: Trainee) => void;
  onViewTraining?: (trainee: Trainee) => void;
  onViewCertificates?: (trainee: Trainee) => void;
}

const STATUS_BADGES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  active: { variant: 'default', label: 'Active' },
  inactive: { variant: 'secondary', label: 'Inactive' },
  on_leave: { variant: 'outline', label: 'On Leave' },
  terminated: { variant: 'destructive', label: 'Terminated' },
};

const DOCUMENT_STATUS_BADGES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  valid: { variant: 'default', label: 'Valid' },
  expired: { variant: 'destructive', label: 'Expired' },
  expiring_soon: { variant: 'outline', label: 'Expiring Soon' },
  pending_verification: { variant: 'secondary', label: 'Pending Verification' },
  rejected: { variant: 'destructive', label: 'Rejected' },
};

export function TraineeListing({
  initialTrainees = [],
  onAddTrainee,
  onViewTrainee,
  onEditTrainee,
  onDeleteTrainee,
  onViewDocuments,
  onViewTraining,
  onViewCertificates,
}: TraineeListingProps) {
  const [trainees, setTrainees] = useState<Trainee[]>(initialTrainees);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobTitleFilter, setJobTitleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'firstName' | 'lastName' | 'jobTitle' | 'status' | 'createdAt'>('firstName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(false);

  const jobTitles = Array.from(
    new Set(trainees.map(t => t.jobTitle).filter(Boolean))
  ) as string[];

  const filteredTrainees = trainees
    .filter(t => {
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          t.firstName.toLowerCase().includes(searchLower) ||
          t.lastName.toLowerCase().includes(searchLower) ||
          t.email?.toLowerCase().includes(searchLower) ||
          t.employeeId?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .filter(t => statusFilter === 'all' || t.status === statusFilter)
    .filter(t => jobTitleFilter === 'all' || t.jobTitle === jobTitleFilter)
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = useCallback((field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }, [sortBy]);

  const SortIcon = ({ field }: { field: typeof sortBy }) => {
    if (sortBy !== field) return <ChevronDown className="h-4 w-4 text-muted-foreground" />;
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_BADGES[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDocumentStatusBadge = (status: string) => {
    const config = DOCUMENT_STATUS_BADGES[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button onClick={onAddTrainee}>
            <Plus className="mr-2 h-4 w-4" />
            Add Trainee
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search trainees..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>

          <Select value={jobTitleFilter} onValueChange={setJobTitleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Job Titles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Job Titles</SelectItem>
              {jobTitles.map(title => (
                <SelectItem key={title} value={title}>{title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Trainees Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingState message="Loading trainees..." />
            </div>
          ) : filteredTrainees.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No trainees found"
              description={search || statusFilter !== 'all' || jobTitleFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Add your first trainee to begin tracking identity documents, training sessions, and competencies.'}
              action={
                <Button onClick={onAddTrainee}>
                  <Plus className="mr-2 h-4 w-4" />
                  Register Trainee
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('firstName')}>
                      <div className="flex items-center gap-1">
                        Name <SortIcon field="firstName" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('jobTitle')}>
                      <div className="flex items-center gap-1">
                        Job Title <SortIcon field="jobTitle" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-1">
                        Status <SortIcon field="status" />
                      </div>
                    </TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Training Sessions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrainees.map(trainee => (
                    <TableRow key={trainee.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{trainee.firstName} {trainee.lastName}</p>
                          <p className="text-sm text-muted-foreground">
                            {trainee.employeeId ? `ID: ${trainee.employeeId}` : 'No Employee ID'}
                          </p>
                          {trainee.email && (
                            <p className="text-sm text-muted-foreground">{trainee.email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{trainee.jobTitle || '—'}</p>
                      </TableCell>
                      <TableCell>{getStatusBadge(trainee.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {trainee.documents.slice(0, 3).map(doc => (
                            <Badge key={doc.id} variant="outline" className="text-xs">
                              {doc.type}: {getDocumentStatusBadge(doc.status)}
                            </Badge>
                          ))}
                          {trainee._count.documents > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{trainee._count.documents - 3} more
                            </Badge>
                          )}
                          {trainee._count.documents === 0 && (
                            <Badge variant="secondary" className="text-xs">No documents</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {trainee.trainingSessions.slice(0, 2).map(session => (
                            <Badge key={session.id} variant="outline" className="text-xs">
                              {session.training?.module || 'Session'} - {session.status}
                            </Badge>
                          ))}
                          {trainee._count.trainingSessions > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{trainee._count.trainingSessions - 2} more
                            </Badge>
                          )}
                          {trainee._count.trainingSessions === 0 && (
                            <Badge variant="secondary" className="text-xs">No sessions</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onViewTrainee?.(trainee)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onViewDocuments?.(trainee)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Documents ({trainee._count.documents})
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onViewTraining?.(trainee)}>
                              <GraduationCap className="mr-2 h-4 w-4" />
                              Training ({trainee._count.trainingSessions})
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onViewCertificates?.(trainee)}>
                              <Award className="mr-2 h-4 w-4" />
                              Certificates
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onEditTrainee?.(trainee)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDeleteTrainee?.(trainee)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}