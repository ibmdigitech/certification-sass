"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertBanner } from "@/components/ui/alert-banner";
import {
  ClipboardCheck,
  Loader2,
  Plus,
  Save,
  Send,
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  CheckCircle,
} from "lucide-react";
import { TimesheetEquipmentItems } from "@/components/timesheets/TimesheetEquipmentItems";
import { TIMESHEET_STATUS_COLORS } from "@/lib/services/timesheet.service";

interface Job {
  id: number;
  jobNumber: string;
  type: string | null;
  status: string;
  scheduledDate: string | null;
  site: string | null;
  location: { code: string | null; name: string | null } | null;
  customer: { contact: string | null; name: string | null; email: string | null; phone: string | null } | null;
  engineer: { id: number; name: string | null } | null;
  assignedInspector: { id: number; name: string | null } | null;
}

interface EquipmentItem {
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

interface TimesheetRecord {
  id: number;
  timesheetNumber: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  totalWorkingHours: number | null;
  workCompletionStatus: string | null;
}

interface FormData {
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  travelTimeMinutes: number;
  workCompletionStatus: string;
  inspectionResult: string;
  workLocation: string;
  description: string;
  additionalWork: string;
}

export default function JobPerformingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const companyId = session?.user?.companyId;
  const engineerId = session?.user?.id;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [timesheets, setTimesheets] = useState<Record<number, TimesheetRecord[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split("T")[0],
    startTime: "08:00",
    endTime: "17:00",
    breakMinutes: 30,
    travelTimeMinutes: 0,
    workCompletionStatus: "",
    inspectionResult: "",
    workLocation: "",
    description: "",
    additionalWork: "",
  });

  useEffect(() => {
    if (!companyId || !engineerId) return;

    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/jobs?companyId=${companyId}&engineerId=${engineerId}`);
        if (!res.ok) throw new Error("Failed to fetch jobs");
        const data = await res.json();
        setJobs(data.jobs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load jobs");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [companyId, engineerId]);

  const loadTimesheetsForJob = async (jobId: number) => {
    try {
      const res = await fetch(`/api/timesheets?jobId=${jobId}&companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setTimesheets((prev) => ({ ...prev, [jobId]: data.timesheets || [] }));
      }
    } catch {
      // ignore
    }
  };

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    loadTimesheetsForJob(job.id);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      startTime: "08:00",
      endTime: "17:00",
      breakMinutes: 30,
      travelTimeMinutes: 0,
      workCompletionStatus: "",
      inspectionResult: "",
      workLocation: job.site || "",
      description: "",
      additionalWork: "",
    });
    setEquipmentItems([]);
  };

  const handleInput = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = async () => {
    if (!selectedJob || !companyId || !engineerId) return;
    setIsSaving(true);
    setError(null);
    try {
      const body = {
        companyId,
        userId: engineerId,
        jobId: selectedJob.id,
        timesheetType: "INSPECTION",
        date: formData.date,
        startTime: `${formData.date}T${formData.startTime}`,
        endTime: `${formData.date}T${formData.endTime}`,
        breakMinutes: formData.breakMinutes,
        travelTimeMinutes: formData.travelTimeMinutes,
        workCompletionStatus: formData.workCompletionStatus || null,
        inspectionResult: formData.inspectionResult || null,
        workLocation: formData.workLocation || null,
        description: formData.description || null,
        additionalWork: formData.additionalWork || null,
        equipmentItems,
      };

      const res = await fetch("/api/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save timesheet draft");

      await loadTimesheetsForJob(selectedJob.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitTimesheet = async () => {
    if (!selectedJob || !companyId || !engineerId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const body = {
        companyId,
        userId: engineerId,
        jobId: selectedJob.id,
        timesheetType: "INSPECTION",
        date: formData.date,
        startTime: `${formData.date}T${formData.startTime}`,
        endTime: `${formData.date}T${formData.endTime}`,
        breakMinutes: formData.breakMinutes,
        travelTimeMinutes: formData.travelTimeMinutes,
        workCompletionStatus: formData.workCompletionStatus || null,
        inspectionResult: formData.inspectionResult || null,
        workLocation: formData.workLocation || null,
        description: formData.description || null,
        additionalWork: formData.additionalWork || null,
        equipmentItems,
      };

      const createRes = await fetch("/api/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!createRes.ok) throw new Error("Failed to create timesheet");
      const created = await createRes.json();

      const submitRes = await fetch(`/api/timesheets/${created.id}?action=submit`, {
        method: "POST",
      });
      if (!submitRes.ok) throw new Error("Failed to submit timesheet");

      await loadTimesheetsForJob(selectedJob.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!companyId || !engineerId) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Job Performing"
        description="Engineers log work hours and submit timesheets directly from assigned jobs."
        action={
          <Button onClick={() => router.push("/timesheets")}>
            <FileText className="mr-2 h-4 w-4" />
            All Timesheets
          </Button>
        }
      />

      {error && <AlertBanner variant="error" title="Error" description={error} />}

      {!selectedJob ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No jobs assigned to you.
              </p>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="border rounded-lg p-4 hover:bg-muted/20 cursor-pointer"
                    onClick={() => handleSelectJob(job)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{job.jobNumber}</h3>
                        <p className="text-sm text-muted-foreground">
                          {job.customer?.contact || "Unknown Customer"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={TIMESHEET_STATUS_COLORS[job.status.toLowerCase() as keyof typeof TIMESHEET_STATUS_COLORS] || "bg-gray-100"}>
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                    {job.site && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.site}
                      </p>
                    )}
                    {job.scheduledDate && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(job.scheduledDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Button variant="outline" onClick={() => setSelectedJob(null)}>
            ← Back to Jobs
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>
                Job: {selectedJob.jobNumber} - {selectedJob.customer?.contact || ""}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedJob.site || selectedJob.location?.name || ""}
              </p>
            </CardHeader>
            <CardContent>
              {timesheets[selectedJob.id]?.length > 0 ? (
                <div className="space-y-2">
                  {timesheets[selectedJob.id].map((ts) => (
                    <div
                      key={ts.id}
                      className="border rounded-lg p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{ts.timesheetNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(ts.date).toLocaleDateString()} · {new Date(ts.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(ts.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={TIMESHEET_STATUS_COLORS[ts.status as keyof typeof TIMESHEET_STATUS_COLORS] || "bg-gray-100"}>
                          {ts.status}
                        </Badge>
                        <Button size="sm" variant="ghost" onClick={() => router.push(`/timesheets/${ts.id}`)}>
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No timesheets yet for this job.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Log Work & Generate Timesheet</CardTitle>
              <p className="text-sm text-muted-foreground">
                Fill in work details below. Saving as draft keeps it in "Draft" status.
                Submitting will auto-generate and submit the timesheet.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInput("date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInput("startTime", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInput("endTime", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Break (minutes)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.breakMinutes}
                    onChange={(e) => handleInput("breakMinutes", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Travel Time (minutes)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.travelTimeMinutes}
                    onChange={(e) => handleInput("travelTimeMinutes", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Work Location</Label>
                  <Input
                    value={formData.workLocation}
                    onChange={(e) => handleInput("workLocation", e.target.value)}
                    placeholder={selectedJob.site || ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Work Completion Status</Label>
                  <select
                    value={formData.workCompletionStatus}
                    onChange={(e) => handleInput("workCompletionStatus", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
                  >
                    <option value="">Not Set</option>
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Inspection Result</Label>
                  <select
                    value={formData.inspectionResult}
                    onChange={(e) => handleInput("inspectionResult", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
                  >
                    <option value="">Not Set</option>
                    <option value="PENDING">Pending</option>
                    <option value="PASSED">Passed</option>
                    <option value="FAILED">Failed</option>
                    <option value="NOT_APPLICABLE">N/A</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInput("description", e.target.value)}
                  placeholder="Describe work performed..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Additional Work</Label>
                <Input
                  value={formData.additionalWork}
                  onChange={(e) => handleInput("additionalWork", e.target.value)}
                  placeholder="Any additional work"
                />
              </div>

              <TimesheetEquipmentItems
                equipmentItems={equipmentItems}
                onUpdate={setEquipmentItems}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedJob(null)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving || isSubmitting}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Draft
            </Button>
            <Button onClick={handleSubmitTimesheet} disabled={isSaving || isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit Timesheet
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
