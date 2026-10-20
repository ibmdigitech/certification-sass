"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertBanner } from "@/components/ui/alert-banner";
import { ArrowLeft, Save, Send, Loader2, Calendar, Clock } from "lucide-react";
import { TimesheetEquipmentItems } from "@/components/timesheets/TimesheetEquipmentItems";

interface Job {
  id: number;
  jobNumber: string;
  type: string | null;
  customer: { contact: string | null; name: string | null } | null;
  engineer: { id: number; name: string | null } | null;
}

interface Employee {
  id: number;
  name: string;
  email: string | null;
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

export default function TimesheetNewPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const companyId = session?.user?.companyId;
  const timesheetTypeParam = searchParams?.get("type") || "INSPECTION";

  const [formData, setFormData] = useState({
    jobId: searchParams?.get("jobId") ? Number(searchParams?.get("jobId")) : undefined,
    date: new Date().toISOString().split("T")[0],
    startTime: "08:00",
    endTime: "17:00",
    breakMinutes: 30,
    travelTimeMinutes: 0,
    additionalWork: "",
    workCompletionStatus: "",
    inspectionResult: "",
    workLocation: "",
    description: "",
    timesheetType: timesheetTypeParam,
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!companyId) return;
      try {
        const [jobsRes, employeesRes] = await Promise.all([
          fetch(`/api/jobs?companyId=${companyId}`),
          fetch(`/api/users?companyId=${companyId}&role=engineer`),
        ]);
        if (jobsRes.ok) setJobs((await jobsRes.json()).jobs || []);
        if (employeesRes.ok) setEmployees((await employeesRes.json()).users || []);
      } catch {
        // ignore
      }
    };
    fetchData();
  }, [companyId]);

  const handleInput = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (action: "save" | "submit") => {
    if (!companyId || !session?.user?.id) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        ...formData,
        userId: session.user.id,
        startTime: new Date(`${formData.date}T${formData.startTime}`).toISOString(),
        endTime: new Date(`${formData.date}T${formData.endTime}`).toISOString(),
        equipmentItems,
      };

      if (action === "submit") {
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
      } else {
        const res = await fetch("/api/timesheets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to create timesheet");
      }

      router.push("/timesheets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!companyId) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <PageHeader
        title="New Timesheet"
        description={formData.timesheetType === "TRAINING" ? "Training Timesheet" : "Inspection Timesheet"}
        action={
          <Button variant="outline" size="sm" onClick={() => router.push("/timesheets")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Timesheets
          </Button>
        }
      />

      {error && <AlertBanner variant="error" title="Error" description={error} />}

      <form className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Timesheet Type</Label>
              <select
                value={formData.timesheetType}
                onChange={(e) => handleInput("timesheetType", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
              >
                <option value="INSPECTION">Inspection Timesheet</option>
                <option value="TRAINING">Training Timesheet</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleInput("date", e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobId">Job</Label>
              <select
                value={formData.jobId || ""}
                onChange={(e) => handleInput("jobId", e.target.value ? Number(e.target.value) : undefined)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
              >
                <option value="">No Job (Personal Time)</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.jobNumber} - {job.customer?.contact || "Unknown"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workLocation">Work Location</Label>
              <Input
                value={formData.workLocation}
                onChange={(e) => handleInput("workLocation", e.target.value)}
                placeholder="Enter work location"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInput("description", e.target.value)}
                placeholder="Describe the work performed..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time Tracking</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInput("startTime", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInput("endTime", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breakMinutes">Break (minutes)</Label>
              <Input
                type="number"
                min={0}
                value={formData.breakMinutes}
                onChange={(e) => handleInput("breakMinutes", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="travelTimeMinutes">Travel Time (minutes)</Label>
              <Input
                type="number"
                min={0}
                value={formData.travelTimeMinutes}
                onChange={(e) => handleInput("travelTimeMinutes", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="additionalWork">Additional Work</Label>
              <Input
                value={formData.additionalWork}
                onChange={(e) => handleInput("additionalWork", e.target.value)}
                placeholder="Any additional work details"
              />
            </div>
          </CardContent>
        </Card>

        {formData.timesheetType === "INSPECTION" && (
          <Card>
            <CardHeader>
              <CardTitle>Work Status</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="workCompletionStatus">Work Completion Status</Label>
                <select
                  value={formData.workCompletionStatus}
                  onChange={(e) => handleInput("workCompletionStatus", e.target.value || null)}
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
                <Label htmlFor="inspectionResult">Inspection Result</Label>
                <select
                  value={formData.inspectionResult}
                  onChange={(e) => handleInput("inspectionResult", e.target.value || null)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
                >
                  <option value="">Not Set</option>
                  <option value="PENDING">Pending</option>
                  <option value="PASSED">Passed</option>
                  <option value="FAILED">Failed</option>
                  <option value="NOT_APPLICABLE">N/A</option>
                </select>
              </div>
            </CardContent>
          </Card>
        )}

        <TimesheetEquipmentItems
          equipmentItems={equipmentItems}
          onUpdate={setEquipmentItems}
        />
      </form>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/timesheets")}>
          Cancel
        </Button>
        <Button variant="outline" onClick={() => handleSubmit("save")} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save as Draft
        </Button>
        <Button onClick={() => handleSubmit("submit")} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Save and Submit
        </Button>
      </div>
    </div>
  );
}
