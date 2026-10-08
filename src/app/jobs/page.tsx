"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, Loader2 } from "lucide-react";
import { JobTable } from "@/components/jobs/JobTable";
import { JobForm } from "@/components/jobs/JobForm";
import { Job, Customer, User, JobStatus, JobListParams, JobListResponse } from "@/types/job";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AlertBanner } from "@/components/ui/alert-banner";

const COMPANY_ID = 1; // TODO: Get from auth context

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [engineers, setEngineers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState<JobListParams>({ page: 1, limit: 20 });

  const fetchJobs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data: JobListResponse = await res.json();
      setJobs(data.jobs);
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`/api/customers`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || data);
      }
    } catch {
      // Ignore error
    }
  };

  const fetchEngineers = async () => {
    try {
      const res = await fetch(`/api/users?role=engineer`);
      if (res.ok) {
        const data = await res.json();
        setEngineers(data.users || data);
      }
    } catch {
      // Ignore error
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchCustomers();
    fetchEngineers();
  }, [filters.page, filters.status, filters.customerId, filters.engineerId]);

  const handleCreateJob = async (data: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, companyId: COMPANY_ID }),
      });
      if (!res.ok) throw new Error('Failed to create job');
      setIsFormOpen(false);
      fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateJob = async (data: any) => {
    if (!selectedJob) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update job');
      setSelectedJob(null);
      setIsFormOpen(false);
      fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (job: Job) => {
    if (!confirm(`Are you sure you want to delete job ${job.jobNumber}?`)) return;
    try {
      const res = await fetch(`/api/jobs/${job.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete job');
      fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job');
    }
  };

  const handleEdit = (job: Job) => {
    setSelectedJob(job);
    setIsFormOpen(true);
  };

  const handleView = (job: Job) => {
    // TODO: Navigate to job detail page
    alert(`View job ${job.jobNumber} - detail page not yet implemented`);
  };

  const handleAssignEngineer = (job: Job) => {
    setSelectedJob(job);
    setIsFormOpen(true);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleFilterChange = (key: keyof JobListParams, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Job Orders"
        description="Manage job orders, assignments, and status tracking."
        action={
          <Button onClick={() => { setSelectedJob(null); setIsFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            New Job Order
          </Button>
        }
      />

      {error && (
        <AlertBanner variant="error" title="Error" description={error} />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card border rounded-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by job number..."
            value={filters.jobNumber || ''}
            onChange={(e) => handleFilterChange('jobNumber', e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="on_hold">On Hold</option>
          </select>
          <select
            value={filters.customerId || ''}
            onChange={(e) => handleFilterChange('customerId', e.target.value ? Number(e.target.value) : undefined)}
            className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          >
            <option value="">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.contact}</option>
            ))}
          </select>
          <select
            value={filters.engineerId || ''}
            onChange={(e) => handleFilterChange('engineerId', e.target.value ? Number(e.target.value) : undefined)}
            className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          >
            <option value="">All Engineers</option>
            {engineers.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Job Table */}
      <div className="bg-card border rounded-lg">
        <JobTable
          jobs={jobs}
          onEdit={handleEdit}
          onDelete={handleDeleteJob}
          onView={handleView}
          onAssignEngineer={handleAssignEngineer}
          isLoading={isLoading}
        />
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Job Form Dialog */}
      <JobForm
        job={selectedJob}
        customers={customers}
        engineers={engineers}
        onSubmit={selectedJob ? handleUpdateJob : handleCreateJob}
        onClose={() => { setIsFormOpen(false); setSelectedJob(null); }}
        isLoading={isSubmitting}
      />
    </div>
  );
}