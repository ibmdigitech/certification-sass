"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Loader2, Edit, Plus, ExternalLink, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface JobDetail {
  id: number;
  companyId: number;
  customerId: number;
  jobNumber: string;
  type: string | null;
  status: string;
  scheduledDate: string | null;
  locationId: number | null;
  customerReference: string | null;
  quotationId: string | null;
  priority: string | null;
  scope: string | null;
  internalRemarks: string | null;
  engineerId: number | null;
  inspectorId: number | null;
  customer: { id: number; contact: string | null; email: string | null; phone: string | null } | null;
  engineer: { id: number; name: string } | null;
  assignedInspector: { id: number; name: string } | null;
  location: { id: number; code: string; name: string } | null;
  jobServices: JobServiceDetail[];
  certificates: CertificateSummary[];
  inspections: InspectionSummary[];
  trainingSessions: TrainingSessionSummary[];
  timesheets: TimesheetSummary[];
  payments: PaymentSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface JobServiceDetail {
  id: number;
  jobId: number;
  serviceType: "TRAINING" | "INSPECTION";
  serviceCode: string | null;
  description: string | null;
  status: string;
  requestedDate: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  assignedResponsibleId: number | null;
  completionDate: string | null;
  inspection: {
    id: number;
    inspectionType: string | null;
    equipmentAsset: string | null;
    date: string | null;
    status: string | null;
    approvalStatus: string | null;
  } | null;
  trainingSession: {
    id: number;
    courseId: number | null;
    trainerId: number | null;
    startDate: string;
    endDate: string;
    status: string;
  } | null;
}

interface CertificateSummary {
  id: number;
  number: string;
  status: string;
  certificateType: string | null;
}
interface InspectionSummary {
  id: number;
  inspectionType: string | null;
  status: string | null;
  approvalStatus: string | null;
}
interface TrainingSessionSummary {
  id: number;
  startDate: string;
  endDate: string;
  status: string;
}
interface TimesheetSummary {
  id: number;
  date: string;
  status: string;
}
interface PaymentSummary {
  id: number;
  amount: number;
  status: string | null;
}

const SERVICE_LABELS: Record<string, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};
const SERVICE_COLORS: Record<string, string> = {
  PLANNED: "bg-gray-100 text-gray-800 border-gray-200",
  IN_PROGRESS: "bg-amber-100 text-amber-800 border-amber-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const jobId = Number(params?.id);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) throw new Error("Failed to fetch job");
      const data: JobDetail = await res.json();
      setJob(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) fetchJob();
  }, [jobId]);

  const hasTraining = job?.jobServices.some((s) => s.serviceType === "TRAINING");
  const hasInspection = job?.jobServices.some((s) => s.serviceType === "INSPECTION");

  const progress = {
    training: job?.jobServices.filter((s) => s.serviceType === "TRAINING").length
      ? job!.jobServices.filter((s) => s.serviceType === "TRAINING").some((s) => s.status === "COMPLETED")
        ? "complete"
        : job!.jobServices.filter((s) => s.serviceType === "TRAINING").some((s) => s.status === "IN_PROGRESS")
        ? "in-progress"
        : "pending"
      : "n/a",
    inspection: job?.jobServices.filter((s) => s.serviceType === "INSPECTION").length
      ? job!.jobServices.filter((s) => s.serviceType === "INSPECTION").some((s) => s.status === "COMPLETED")
        ? "complete"
        : job!.jobServices.filter((s) => s.serviceType === "INSPECTION").some((s) => s.status === "IN_PROGRESS")
        ? "in-progress"
        : "pending"
      : "n/a",
    certificates: job?.certificates.length
      ? job.certificates.some((c) => c.status === "ISSUED")
        ? "issued"
        : job.certificates.some((c) => c.status === "REVOKED")
        ? "revoked"
        : "pending"
      : "none",
    payments: job && job.payments.length
      ? job.payments.some((p) => p.status === "PAID")
        ? "paid"
        : job.payments.some((p) => p.status === "PENDING")
        ? "pending"
        : "partial"
      : "none",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (!job) return null;

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title={job.jobNumber}
        description={job.scope || job.type || "Job Order details"}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/jobs/${job.id}/services`)}>
              <Plus className="h-4 w-4 mr-1" /> Add Service
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/jobs")}>
              Back to Jobs
            </Button>
          </div>
        }
      />

      {error && <AlertBanner variant="error" title="Error" description={error} />}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="schedule" disabled={!hasTraining && !hasInspection}>
            Schedule & Assign
          </TabsTrigger>
          {hasTraining ? <TabsTrigger value="training">Training</TabsTrigger> : null}
          {hasInspection ? <TabsTrigger value="inspection">Inspection</TabsTrigger> : null}
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="payments">Payments & Invoices</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="history">Activity History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab job={job} progress={progress} />
        </TabsContent>

        <TabsContent value="services">
          <ServicesTab job={job} />
        </TabsContent>

        <TabsContent value="schedule">
          <ScheduleTab job={job} />
        </TabsContent>

        <TabsContent value="training">
          <TrainingTab job={job} />
        </TabsContent>

        <TabsContent value="inspection">
          <InspectionTab job={job} />
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Document attachments linked to this job order will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timesheets">
          <Card>
            <CardHeader><CardTitle>Timesheets</CardTitle><CardDescription>{job.timesheets.length} entries</CardDescription></CardHeader>
            <CardContent>
              {job.timesheets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No timesheet entries recorded.</p>
              ) : (
                <div className="space-y-2">
                  {job.timesheets.map((t) => (
                    <div key={t.id} className="flex justify-between border p-2 rounded">
                      <span>{new Date(t.date).toLocaleDateString()}</span>
                      <Badge variant={t.status === "approved" ? "default" : "outline"}>{t.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates">
          <Card>
            <CardHeader><CardTitle>Certificates</CardTitle></CardHeader>
            <CardContent>
              {job.certificates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No certificates issued yet. Certificates use the numbering scheme {job.jobNumber}-01, {job.jobNumber}-02…</p>
              ) : (
                <div className="space-y-2">
                  {job.certificates.map((c) => (
                    <div key={c.id} className="flex justify-between items-center border p-2 rounded">
                      <div>
                        <span className="font-medium">{c.number}</span>
                        <span className="text-xs text-muted-foreground ml-2">({c.certificateType})</span>
                      </div>
                      <StatusBadge status={c.status}>{c.status}</StatusBadge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader><CardTitle>Payments & Invoices</CardTitle></CardHeader>
            <CardContent>
              {job.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded.</p>
              ) : (
                <div className="space-y-2">
                  {job.payments.map((p) => (
                    <div key={p.id} className="flex justify-between border p-2 rounded">
                      <span>Amount: {p.amount}</span>
                      <StatusBadge status={p.status ?? "unknown"}>{p.status}</StatusBadge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery">
          <Card>
            <CardHeader><CardTitle>Delivery</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Certificate delivery tracking appears here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle>Activity History</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Job creation, service additions, schedules, status transitions and certificate events will be listed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusBadge({ status, children }: { status: string; children: React.ReactNode }) {
  const color =
    status === "ISSUED" || status === "completed" || status === "COMPLETED"
      ? "bg-emerald-100 text-emerald-800"
      : status === "REVOKED" || status === "cancelled"
      ? "bg-red-100 text-red-800"
      : "bg-amber-100 text-amber-800";
  return (
    <Badge variant="outline" className={cn("text-xs", color)}>
      {children}
    </Badge>
  );
}

function OverviewTab({ job, progress }: { job: JobDetail; progress: Record<string, string> }) {
  const statusColor =
    job.status === "COMPLETED"
      ? "bg-emerald-100 text-emerald-800"
      : job.status === "in_progress"
      ? "bg-amber-100 text-amber-800"
      : "bg-gray-100 text-gray-800";

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Job Order Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Job Number</p>
            <p className="font-medium">{job.jobNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <StatusBadge status={job.status}>{job.status}</StatusBadge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Customer</p>
            <p>{job.customer?.contact || job.customer?.email || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Location</p>
            <p>{job.location?.name || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Priority</p>
            <p>{job.priority || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Requested</p>
            <p>{job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : "—"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Scope</p>
            <p className="whitespace-pre-wrap">{job.scope || "—"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ProgressItem label="Training" state={progress.training} />
          <ProgressItem label="Inspection" state={progress.inspection} />
          <ProgressItem label="Certificates" state={progress.certificates} />
          <ProgressItem label="Payments" state={progress.payments} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Assigned Personnel</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p>Engineer: {job.engineer?.name || <span className="text-muted-foreground">Unassigned</span>}</p>
          <p>Inspector: {job.assignedInspector?.name || <span className="text-muted-foreground">Unassigned</span>}</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-3">
        <CardHeader><CardTitle>Outstanding Actions</CardTitle></CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-sm space-y-1">
            {job.jobServices.filter((s) => s.status !== "COMPLETED").map((s) => (
              <li key={s.id}>
                {s.serviceType === "TRAINING" ? "Training" : "Inspection"} service
                <span className="font-medium"> {s.description || s.serviceType}</span> — {SERVICE_LABELS[s.status] ?? s.status}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function ProgressItem({ label, state }: { label: string; state: string }) {
  const Icon = state === "complete" || state === "issued" || state === "paid" ? CheckCircle : Clock;
  const color =
    state === "complete" || state === "issued" || state === "paid"
      ? "text-emerald-600"
      : state === "in-progress" || state === "pending"
      ? "text-amber-600"
      : "text-gray-400";
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <span className={cn("flex items-center gap-1 text-sm font-medium", color)}>
        <Icon className="h-4 w-4" />
        {state}
      </span>
    </div>
  );
}

function ServicesTab({ job }: { job: JobDetail }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => {}}>
          <Plus className="h-4 w-4 mr-1" /> Add Service
        </Button>
      </div>
      {job.jobServices.length === 0 ? (
        <p className="text-sm text-muted-foreground">No service lines on this job.</p>
      ) : (
        job.jobServices.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {s.serviceType === "TRAINING" ? "Training Certification" : "Inspection Certification"}
                <StatusBadge status={s.status}>{SERVICE_LABELS[s.status] ?? s.status}</StatusBadge>
              </CardTitle>
              <CardDescription>{s.description || s.serviceCode}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2 text-sm">
              <p>
                Requested:{" "}
                {s.requestedDate ? new Date(s.requestedDate).toLocaleDateString() : "—"}
              </p>
              <p>
                Scheduled:{" "}
                {s.scheduledStart && s.scheduledEnd
                  ? `${new Date(s.scheduledStart).toLocaleString()} → ${new Date(s.scheduledEnd).toLocaleString()}`
                  : "—"}
              </p>
              <p>Completion: {s.completionDate ? new Date(s.completionDate).toLocaleDateString() : "—"}</p>
              <p>
                Responsible:{" "}
                <a
                  href={s.assignedResponsibleId ? `/users/${s.assignedResponsibleId}` : "#"}
                  className="underline"
                >
                  {s.assignedResponsibleId || "Unassigned"}
                </a>
              </p>
              {s.inspection ? (
                <p>
                  Inspection #{s.inspection.id}: {s.inspection.inspectionType} — {s.inspection.approvalStatus}
                </p>
              ) : null}
              {s.trainingSession ? (
                <p>
                  Session #{s.trainingSession.id}: status {s.trainingSession.status}
                  <a
                    href={s.trainingSession.id ? `/training/sessions/${s.trainingSession.id}` : "#"}
                    className="underline ml-2"
                  >
                    <ExternalLink className="h-3 w-3 inline" />
                  </a>
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function ScheduleTab({ job }: { job: JobDetail }) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Schedule and assign personnel for each service. Training and inspection are scheduled
        independently; the two personnel may differ.
      </p>
      {job.jobServices.map((s) => (
        <Card key={s.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {s.serviceType === "TRAINING" ? "Training" : "Inspection"} — Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2 text-sm">
            <p>Status: {SERVICE_LABELS[s.status] ?? s.status}</p>
            <p>
              Window:{" "}
              {s.scheduledStart && s.scheduledEnd
                ? `${new Date(s.scheduledStart).toLocaleString()} → ${new Date(s.scheduledEnd).toLocaleString()}`
                : "Not scheduled"}
            </p>
            {s.assignedResponsibleId ? (
              <p>Assigned responsible: #{s.assignedResponsibleId}</p>
            ) : (
              <p>Assigned responsible: none</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TrainingTab({ job }: { job: JobDetail }) {
  return (
    <div className="space-y-4">
      {job.jobServices.filter((s) => s.serviceType === "TRAINING").length === 0 ? (
        <p className="text-sm text-muted-foreground">This job has no training service.</p>
      ) : (
        job.jobServices.filter((s) => s.serviceType === "TRAINING").map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle>Training Session #{s.trainingSession?.id ?? "—"}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {s.trainingSession ? (
                <p>Status: {s.trainingSession.status}</p>
              ) : (
                <p>Session not yet created. Use Schedule &amp; Assign to create it.</p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function InspectionTab({ job }: { job: JobDetail }) {
  return (
    <div className="space-y-4">
      {job.jobServices.filter((s) => s.serviceType === "INSPECTION").length === 0 ? (
        <p className="text-sm text-muted-foreground">This job has no inspection service.</p>
      ) : (
        job.jobServices.filter((s) => s.serviceType === "INSPECTION").map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle>Inspection #{s.inspection?.id ?? "—"}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {s.inspection ? (
                <p>Status: {s.inspection.status} | Approval: {s.inspection.approvalStatus}</p>
              ) : (
                <p>Inspection not yet created. Use Schedule &amp; Assign to create it.</p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
