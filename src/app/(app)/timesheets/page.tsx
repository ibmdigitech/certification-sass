"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Badge } from "@/components/ui/badge";
import {
  TIMESHEET_STATUS_LABELS,
  TIMESHEET_STATUS_COLORS,
} from "@/lib/services/timesheet.service";
import { TimesheetTypeSelector } from "@/components/timesheets/TimesheetTypeSelector";

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface Timesheet {
  id: number;
  companyId: number;
  timesheetNumber: string;
  timesheetType: string;
  userId: number;
  jobId: number | null;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  travelTimeMinutes: number;
  totalWorkingHours: number | null;
  overtimeHours: number | null;
  additionalWork: string | null;
  workCompletionStatus: string | null;
  inspectionResult: string | null;
  workLocation: string | null;
  description: string | null;
  status: string;
  submittedAt: string | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: number; name: string; email: string | null } | null;
  job: {
    id: number;
    jobNumber: string;
    customer: { contact: string | null } | null;
  } | null;
  equipmentItems: {
    id: number;
    equipmentType: string | null;
    equipmentDescription: string | null;
    inspectionResult: string | null;
    certificateStatus: string | null;
  }[];
}

interface TimesheetListParams {
  page?: number;
  limit?: number;
  userId?: number;
  jobId?: number;
  jobNumber?: string;
  timesheetNumber?: string;
  status?: string;
  statuses?: string[];
  dateFrom?: string;
  dateTo?: string;
  engineerId?: number;
  customerId?: number;
  equipmentType?: string;
  inspectionResult?: string;
  timesheetType?: string;
}

const TIMESHEET_TYPE_LABELS: Record<string, string> = {
  INSPECTION: "Inspection",
  TRAINING: "Training",
};

export default function TimesheetsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const companyId = session?.user?.companyId;
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState<TimesheetListParams>({
    page: 1,
    limit: 20,
    timesheetType: searchParams?.get("type") || "INSPECTION",
  });

  const fetchTimesheets = async () => {
    if (!companyId) return;
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("companyId", String(companyId));
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== null) {
          if (Array.isArray(value)) {
            params.set(key, value.join(","));
          } else {
            params.append(key, String(value));
          }
        }
      });
      const res = await fetch(`/api/timesheets?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch timesheets");
      const data = await res.json();
      setTimesheets(data.timesheets || []);
      setPagination({
        page: data.page || 1,
        limit: data.limit || 20,
        total: data.total || 0,
        totalPages: data.totalPages || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, [filters, companyId]);

  const handleFilterChange = (key: keyof TimesheetListParams, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleView = (ts: Timesheet) => {
    router.push(`/timesheets/${ts.id}`);
  };

  const handleCreate = () => {
    router.push(`/timesheets/new?type=${filters.timesheetType || "INSPECTION"}`);
  };

  const handleExport = () => {
    const csv = [
      ["Timesheet #", "Type", "Engineer", "Date", "Hours", "Status", "Job"],
      ...timesheets.map((ts) => [
        ts.timesheetNumber,
        TIMESHEET_TYPE_LABELS[ts.timesheetType] || ts.timesheetType,
        ts.user?.name || "—",
        formatDate(ts.date),
        ts.totalWorkingHours?.toString() || "—",
        ts.status,
        ts.job?.jobNumber || "—",
      ]),
    ];
    const blob = new Blob(
      [csv.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")],
      { type: "text/csv" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheets-${filters.timesheetType || "inspection"}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusOptions = Object.entries(TIMESHEET_STATUS_LABELS).map(([value, label]) => ({ value, label }));

  if (!companyId) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title={filters.timesheetType === "TRAINING" ? "Training Timesheets" : "Inspection Timesheets"}
        description="Manage timesheet entries, hours tracking, and status workflow."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={timesheets.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button size="sm" onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Timesheet
            </Button>
          </div>
        }
      />

      {error && <AlertBanner variant="error" title="Error" description={error} />}

      <TimesheetTypeSelector
        value={filters.timesheetType || "INSPECTION"}
        onChange={(value) => handleFilterChange("timesheetType", value)}
      />

      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card border rounded-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by timesheet number..."
            value={filters.timesheetNumber || ""}
            onChange={(e) => handleFilterChange("timesheetNumber", e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filters.status || ""}
            onChange={(e) => handleFilterChange("status", e.target.value || undefined)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.dateFrom || ""}
            onChange={(e) => handleFilterChange("dateFrom", e.target.value || undefined)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
          />
          <input
            type="date"
            value={filters.dateTo || ""}
            onChange={(e) => handleFilterChange("dateTo", e.target.value || undefined)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
          />
        </div>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          </div>
        ) : timesheets.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No timesheets found. Create your first timesheet to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">Timesheet #</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Engineer</th>
                  <th className="text-left p-3 font-medium">Job</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-right p-3 font-medium">Hours</th>
                  <th className="text-left p-3 font-medium">Work Completion</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {timesheets.map((ts) => (
                  <tr key={ts.id} className="border-b hover:bg-muted/20">
                    <td className="p-3 font-mono text-xs">{ts.timesheetNumber}</td>
                    <td className="p-3">
                      <Badge variant="outline">
                        {TIMESHEET_TYPE_LABELS[ts.timesheetType] || ts.timesheetType}
                      </Badge>
                    </td>
                    <td className="p-3">{ts.user?.name || "—"}</td>
                    <td className="p-3">{ts.job?.jobNumber || "—"}</td>
                    <td className="p-3">{formatDate(ts.date)}</td>
                    <td className="p-3 text-right">
                      {ts.totalWorkingHours?.toFixed(2) || "—"}
                      {ts.overtimeHours && ts.overtimeHours > 0 && (
                        <span className="text-xs text-muted-foreground block">
                          OT: {ts.overtimeHours.toFixed(1)}h
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {ts.workCompletionStatus ? (
                        <Badge variant="secondary" className="text-xs">
                          {ts.workCompletionStatus}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <Badge className={TIMESHEET_STATUS_COLORS[ts.status as keyof typeof TIMESHEET_STATUS_COLORS] || "bg-gray-100"}>
                        {TIMESHEET_STATUS_LABELS[ts.status as keyof typeof TIMESHEET_STATUS_LABELS] || ts.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm" onClick={() => handleView(ts)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
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
    </div>
  );
}
