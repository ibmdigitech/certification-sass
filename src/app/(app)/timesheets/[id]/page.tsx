"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Save,
  Send,
  CheckCircle,
  XCircle,
  RotateCw,
  Loader2,
  Eye,
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  Check,
  X,
} from "lucide-react";
import {
  TIMESHEET_STATUS_LABELS,
  TIMESHEET_STATUS_COLORS,
} from "@/lib/services/timesheet.service";
import { TimesheetEquipmentItems } from "@/components/timesheets/TimesheetEquipmentItems";
import { AlertBanner } from "@/components/ui/alert-banner";

interface TimesheetDetail {
  id: number;
  companyId: number;
  timesheetNumber: string;
  timesheetType: string;
  userId: number;
  jobId: number | null;
  jobServiceId: number | null;
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
  approvedBy: number | null;
  reviewedBy: number | null;
  reviewComments: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: number; name: string; email: string | null } | null;
  job: {
    id: number;
    jobNumber: string;
    customer: { contact: string | null; email: string | null; phone: string | null; name: string | null } | null;
    engineer: { id: number; name: string | null } | null;
  } | null;
  approver: { id: number; name: string | null } | null;
  reviewer: { id: number; name: string | null } | null;
  equipmentItems: TimesheetEquipmentItemDetail[];
}

interface TimesheetEquipmentItemDetail {
  id: number;
  equipmentId: number | null;
  equipmentType: string | null;
  equipmentDescription: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  equipmentCode: string | null;
  quantity: number | null;
  inspectionResult: string | null;
  inspectionDate: string | null;
  remarks: string | null;
  certificateStatus: string | null;
  reportStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TimesheetDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TimesheetDetailPage({ params }: TimesheetDetailPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [timesheet, setTimesheet] = useState<TimesheetDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const companyId = session?.user?.companyId;

  useEffect(() => {
    const fetchTimesheet = async () => {
      if (!companyId) return;
      const { id } = await params;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/timesheets/${id}`);
        if (!res.ok) throw new Error("Failed to fetch timesheet");
        const data = await res.json();
        setTimesheet(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTimesheet();
  }, [params, companyId]);

  const handleAction = async (action: string, body?: Record<string, unknown>) => {
    if (!timesheet) return;
    setActionLoading(action);
    try {
      const res = await fetch(`/api/timesheets/${timesheet.id}?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      });
      if (!res.ok) throw new Error("Failed to process action");
      const data = await res.json();
      setTimesheet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSave = async () => {
    if (!timesheet || !session?.user?.companyId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/timesheets/${timesheet.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: timesheet.date,
          startTime: timesheet.startTime,
          endTime: timesheet.endTime,
          breakMinutes: timesheet.breakMinutes,
          travelTimeMinutes: timesheet.travelTimeMinutes,
          additionalWork: timesheet.additionalWork,
          workCompletionStatus: timesheet.workCompletionStatus,
          inspectionResult: timesheet.inspectionResult,
          workLocation: timesheet.workLocation,
          description: timesheet.description,
          equipmentItems: timesheet.equipmentItems,
        }),
      });
      if (!res.ok) throw new Error("Failed to update timesheet");
      const data = await res.json();
      setTimesheet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableActions = () => {
    if (!timesheet) return [];
    const actions: { key: string; label: string; icon: React.ElementType; variant?: "default" | "destructive" | "outline" | "secondary" }[] = [];
    const status = timesheet.status;

    if (status === "draft" || status === "returned") {
      actions.push({ key: "submit", label: "Submit", icon: Send, variant: "default" });
    }
    if (status === "submitted") {
      actions.push({ key: "move-to-review", label: "Move to Review", icon: RotateCw, variant: "outline" });
    }
    if (status === "pending_review") {
      actions.push({ key: "approve", label: "Approve", icon: CheckCircle, variant: "default" });
      actions.push({ key: "reject", label: "Reject", icon: XCircle, variant: "destructive" });
      actions.push({ key: "return", label: "Return for Correction", icon: RotateCw, variant: "secondary" });
    }
    if (status === "approved") {
      actions.push({ key: "lock", label: "Lock", icon: Edit, variant: "outline" });
    }

    return actions;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!timesheet) {
    return (
      <div className="p-8">
        <Button variant="link" onClick={() => router.push("/timesheets")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Timesheets
        </Button>
        {error && <AlertBanner variant="error" title="Error" description={error} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <PageHeader
        title={timesheet.timesheetNumber}
        description={`Timesheet for ${timesheet.user?.name || "Unknown Engineer"}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/timesheets")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {getAvailableActions().map((action) => {
              const Icon = action.icon;
              const isLoading = actionLoading === action.key;
              return (
                <Button
                  key={action.key}
                  variant={action.variant || "default"}
                  size="sm"
                  disabled={isLoading}
                  onClick={() =>
                    action.key === "reject" || action.key === "return"
                      ? handleAction(action.key, { comments: prompt("Enter comments (optional):") || undefined })
                      : handleAction(action.key)
                  }
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Icon className="mr-2 h-4 w-4" />}
                  {action.label}
                </Button>
              );
            })}
          </div>
        }
      />

      {error && <AlertBanner variant="error" title="Error" description={error} />}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Timesheet Details</span>
            <Badge className={TIMESHEET_STATUS_COLORS[timesheet.status as keyof typeof TIMESHEET_STATUS_COLORS] || "bg-gray-100"}>
              {TIMESHEET_STATUS_LABELS[timesheet.status as keyof typeof TIMESHEET_STATUS_LABELS] || timesheet.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Timesheet Number</label>
              <p className="font-mono text-sm">{timesheet.timesheetNumber}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Type</label>
              <p>{timesheet.timesheetType === "TRAINING" ? "Training" : "Inspection"}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Engineer</label>
              <p>{timesheet.user?.name || "—"}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Job</label>
              <p>{timesheet.job?.jobNumber || "No job assigned"}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Customer</label>
              <p>{timesheet.job?.customer?.contact || "—"}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Work Location</label>
              <p>{timesheet.workLocation || "—"}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Date</label>
              <p>{formatDate(timesheet.date)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Start Time</label>
                <p>{formatTime(timesheet.startTime)}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">End Time</label>
                <p>{formatTime(timesheet.endTime)}</p>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Break (minutes)</label>
              <p>{timesheet.breakMinutes || 0}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Travel Time (minutes)</label>
              <p>{timesheet.travelTimeMinutes || 0}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Total Working Hours</label>
              <p className="font-medium">{timesheet.totalWorkingHours?.toFixed(2) || "—"}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Overtime Hours</label>
              <p className="font-medium">{timesheet.overtimeHours?.toFixed(1) || "0"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Work Completion Status</label>
            <p>
              <Badge variant="outline">{timesheet.workCompletionStatus || "Not set"}</Badge>
            </p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Inspection Result</label>
            <p>
              <Badge variant="outline">{timesheet.inspectionResult || "Not set"}</Badge>
            </p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Description</label>
            <p className="text-sm">{timesheet.description || "No description provided."}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Additional Work</label>
            <p className="text-sm">{timesheet.additionalWork || "None"}</p>
          </div>
        </CardContent>
      </Card>

      <TimesheetEquipmentItems
        equipmentItems={timesheet.equipmentItems}
        onUpdate={(items) => {
          setTimesheet((prev) =>
            prev ? { ...prev, equipmentItems: items } : prev
          );
        }}
      />

      {timesheet.reviewComments && (
        <Card>
          <CardHeader>
            <CardTitle>Review Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{timesheet.reviewComments}</p>
            {timesheet.reviewedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Reviewed by {timesheet.reviewer?.name || "—"} on {formatDate(timesheet.reviewedAt)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Button onClick={handleSave} disabled={isSubmitting} variant="outline">
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save Changes
      </Button>
    </div>
  );
}
