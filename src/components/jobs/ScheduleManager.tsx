"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  ShieldAlert,
  Loader2,
  FileText,
  MapPin,
  ExternalLink,
  Users,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertBanner } from "@/components/ui/alert-banner";

interface JobServiceItem {
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
  assignedResponsible?: {
    id: number;
    name: string;
    email: string;
    role: string;
  } | null;
  inspection: {
    id: number;
    inspectionType: string | null;
    equipmentAsset: string | null;
    date: string | null;
    status: string | null;
  } | null;
  trainingSession: {
    id: number;
    courseId: number | null;
    course?: { title: string; code: string } | null;
    trainerId: number | null;
    trainer?: { user: { name: string; email: string } } | null;
    startDate: string;
    endDate: string;
    status: string;
    enrolledCount?: number;
  } | null;
}

interface ScheduleManagerProps {
  jobId: number;
  jobNumber: string;
  jobServices: JobServiceItem[];
  defaultLocationId?: number | null;
  onScheduleUpdated: () => void;
}

interface ScheduleOptions {
  courses: Array<{ id: number; code: string; title: string; trainingHours?: number | null }>;
  trainers: Array<{ id: number; name: string; email: string; role: string }>;
  inspectors: Array<{ id: number; name: string; email: string; role: string }>;
  locations: Array<{ id: number; code: string; name: string; emirate?: string | null }>;
  trainees: Array<{ id: number; name: string; emiratesId: string | null; companyName?: string | null }>;
}

export function ScheduleManager({
  jobId,
  jobNumber,
  jobServices,
  defaultLocationId,
  onScheduleUpdated,
}: ScheduleManagerProps) {
  const [options, setOptions] = useState<ScheduleOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedService, setSelectedService] = useState<JobServiceItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("17:00");
  const [responsibleId, setResponsibleId] = useState<string>("");
  const [courseId, setCourseId] = useState<string>("");
  const [locationId, setLocationId] = useState<string>("");
  const [inspectionType, setInspectionType] = useState<string>("Periodic Thorough Examination");
  const [equipmentAsset, setEquipmentAsset] = useState<string>("");
  const [specialInstructions, setSpecialInstructions] = useState<string>("");
  const [selectedTrainees, setSelectedTrainees] = useState<number[]>([]);

  // Conflict / Override states
  const [conflictData, setConflictData] = useState<{
    conflictJobNumber?: string;
    conflictingStart?: string;
    conflictingEnd?: string;
  } | null>(null);
  const [forceOverride, setForceOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Fetch options once on mount or when dialog opens
  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/schedule`);
      if (res.ok) {
        const data = await res.json();
        if (data.options) {
          setOptions(data.options);
        }
      }
    } catch (e) {
      console.error("Failed to fetch schedule options", e);
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [jobId]);

  const openScheduleDialog = (service: JobServiceItem) => {
    setSelectedService(service);
    setSubmitError(null);
    setConflictData(null);
    setForceOverride(false);
    setOverrideReason("");

    // Initialize dates
    const startObj = service.scheduledStart
      ? new Date(service.scheduledStart)
      : service.requestedDate
      ? new Date(service.requestedDate)
      : new Date();
    const endObj = service.scheduledEnd
      ? new Date(service.scheduledEnd)
      : new Date(startObj.getTime() + 8 * 3600 * 1000);

    setStartDate(format(startObj, "yyyy-MM-dd"));
    setStartTime(format(startObj, "HH:mm"));
    setEndDate(format(endObj, "yyyy-MM-dd"));
    setEndTime(format(endObj, "HH:mm"));

    setResponsibleId(
      service.assignedResponsibleId ? String(service.assignedResponsibleId) : ""
    );
    setLocationId(defaultLocationId ? String(defaultLocationId) : "");

    if (service.serviceType === "TRAINING") {
      setCourseId(
        service.trainingSession?.courseId
          ? String(service.trainingSession.courseId)
          : ""
      );
    } else {
      setInspectionType(
        service.inspection?.inspectionType || "Periodic Thorough Examination"
      );
      setEquipmentAsset(service.inspection?.equipmentAsset || "");
    }

    setIsDialogOpen(true);
  };

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    setSubmitting(true);
    setSubmitError(null);

    const startDateTime = new Date(`${startDate}T${startTime}:00`).toISOString();
    const endDateTime = new Date(`${endDate}T${endTime}:00`).toISOString();

    const payload: any = {
      serviceType: selectedService.serviceType,
      jobServiceId: selectedService.id,
      scheduledStart: startDateTime,
      scheduledEnd: endDateTime,
      assignedResponsibleId: responsibleId ? Number(responsibleId) : undefined,
      locationId: locationId ? Number(locationId) : undefined,
      specialInstructions: specialInstructions || undefined,
      forceOverride,
      overrideReason: forceOverride ? overrideReason : undefined,
    };

    if (selectedService.serviceType === "TRAINING") {
      if (!courseId) {
        setSubmitError("Please select a training course");
        setSubmitting(false);
        return;
      }
      payload.courseId = Number(courseId);
      payload.trainerId = responsibleId ? Number(responsibleId) : undefined;
      if (selectedTrainees.length > 0) {
        payload.traineeIds = selectedTrainees;
      }
    } else {
      payload.inspectorId = responsibleId ? Number(responsibleId) : undefined;
      payload.inspectionType = inspectionType;
      payload.equipmentAsset = equipmentAsset;
    }

    try {
      const res = await fetch(`/api/jobs/${jobId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 409 && data.requiresOverride) {
        setConflictData(data.conflict || {});
        setSubmitError(
          "Schedule Conflict: The assigned personnel is already booked during this time window. You can check 'Override Conflict' and provide a justification to proceed."
        );
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule service");
      }

      setSubmitSuccess(
        `${selectedService.serviceType === "TRAINING" ? "Training" : "Inspection"} scheduled successfully!`
      );
      setIsDialogOpen(false);
      onScheduleUpdated();
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred while scheduling");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/40 p-4 rounded-xl border">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Scheduling & Personnel Assignment
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage timelines, assign qualified trainers or inspectors, detect calendar conflicts, and synchronize sessions.
          </p>
        </div>
      </div>

      {submitSuccess && (
        <AlertBanner
          variant="success"
          title="Schedule Updated"
          description={submitSuccess}
        />
      )}

      {jobServices.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No service lines configured for Job {jobNumber}. Add services in the Services tab first.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobServices.map((service) => {
            const isScheduled = !!(service.scheduledStart && service.scheduledEnd);
            const isTraining = service.serviceType === "TRAINING";

            return (
              <Card
                key={service.id}
                className="overflow-hidden border transition-all hover:shadow-md"
              >
                <div
                  className={`h-1.5 w-full ${
                    isTraining ? "bg-blue-600" : "bg-emerald-600"
                  }`}
                />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isTraining ? "default" : "secondary"}
                        className={
                          isTraining
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300"
                            : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-300"
                        }
                      >
                        {isTraining ? "Training Certification" : "Inspection Certification"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          service.status === "SCHEDULED"
                            ? "border-blue-500 text-blue-600 bg-blue-50"
                            : service.status === "COMPLETED"
                            ? "border-green-500 text-green-600 bg-green-50"
                            : "border-gray-300 text-gray-600"
                        }
                      >
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-base mt-2">
                    {service.description ||
                      (isTraining ? "Trainee Certification Course" : "Equipment Safety Inspection")}
                  </CardTitle>
                  <CardDescription>
                    Service Code: {service.serviceCode || (isTraining ? "TRN-01" : "INS-01")}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 text-sm pb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    <span>
                      {isScheduled ? (
                        <span className="font-medium text-foreground">
                          {format(new Date(service.scheduledStart!), "MMM d, yyyy · HH:mm")}{" "}
                          → {format(new Date(service.scheduledEnd!), "HH:mm")}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">
                          Not scheduled yet
                          {service.requestedDate
                            ? ` (Requested: ${format(new Date(service.requestedDate), "MMM d, yyyy")})`
                            : ""}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserCheck className="h-4 w-4 text-primary shrink-0" />
                    <span>
                      {isTraining ? "Trainer: " : "Inspector: "}
                      {service.assignedResponsible ? (
                        <span className="font-medium text-foreground">
                          {service.assignedResponsible.name} ({service.assignedResponsible.email})
                        </span>
                      ) : service.trainingSession?.trainer?.user ? (
                        <span className="font-medium text-foreground">
                          {service.trainingSession.trainer.user.name}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">Unassigned</span>
                      )}
                    </span>
                  </div>

                  {isTraining && service.trainingSession && (
                    <div className="rounded-lg bg-blue-50/60 p-2.5 border border-blue-100 text-xs text-blue-900 space-y-1">
                      <div className="font-semibold flex items-center justify-between">
                        <span>Session #{service.trainingSession.id}</span>
                        <Badge variant="outline" className="text-[10px] bg-white">
                          {service.trainingSession.status}
                        </Badge>
                      </div>
                      <p>
                        Course: {service.trainingSession.course?.title || "Assigned Course"}
                      </p>
                      {service.trainingSession.enrolledCount !== undefined && (
                        <p>Enrolled Trainees: {service.trainingSession.enrolledCount}</p>
                      )}
                    </div>
                  )}

                  {!isTraining && service.inspection && (
                    <div className="rounded-lg bg-emerald-50/60 p-2.5 border border-emerald-100 text-xs text-emerald-900 space-y-1">
                      <div className="font-semibold flex items-center justify-between">
                        <span>Inspection #{service.inspection.id}</span>
                        <Badge variant="outline" className="text-[10px] bg-white">
                          {service.inspection.status || "PLANNED"}
                        </Badge>
                      </div>
                      <p>Type: {service.inspection.inspectionType || "Standard Examination"}</p>
                      {service.inspection.equipmentAsset && (
                        <p>Asset: {service.inspection.equipmentAsset}</p>
                      )}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-0">
                  <Button
                    size="sm"
                    className="w-full"
                    variant={isScheduled ? "outline" : "default"}
                    onClick={() => openScheduleDialog(service)}
                  >
                    <Clock className="h-4 w-4 mr-1.5" />
                    {isScheduled ? "Reschedule / Reassign" : "Schedule Service"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Interactive Scheduling Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {selectedService?.serviceType === "TRAINING"
                ? "Schedule Training Session"
                : "Schedule Inspection"}
            </DialogTitle>
            <DialogDescription>
              Job {jobNumber} — Set the execution window, assign personnel, and verify conflict-free availability.
            </DialogDescription>
          </DialogHeader>

          {submitError && (
            <AlertBanner
              variant="error"
              title="Scheduling Error"
              description={submitError}
            />
          )}

          {conflictData && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-amber-800">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <span>Personnel Scheduling Conflict Detected</span>
              </div>
              <p>
                The selected personnel is already assigned to{" "}
                <span className="font-bold">{conflictData.conflictJobNumber}</span> during:
              </p>
              {conflictData.conflictingStart && conflictData.conflictingEnd && (
                <div className="bg-white/80 p-2 rounded border border-amber-200 text-xs font-mono">
                  {format(new Date(conflictData.conflictingStart), "MMM d, yyyy HH:mm")} →{" "}
                  {format(new Date(conflictData.conflictingEnd), "HH:mm")}
                </div>
              )}

              <div className="pt-2 border-t border-amber-200 space-y-2">
                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceOverride}
                    onChange={(e) => setForceOverride(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>Force Override Conflict (Requires Audit Justification)</span>
                </label>

                {forceOverride && (
                  <div className="space-y-1">
                    <Label className="text-xs">
                      Override Justification <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. Approved by Operations Manager for concurrent multi-team session"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="bg-white"
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitSchedule} className="space-y-4 py-2">
            {/* Time Window */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (!endDate || endDate < e.target.value) {
                      setEndDate(e.target.value);
                    }
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Personnel Assignment */}
            <div className="space-y-2">
              <Label>
                {selectedService?.serviceType === "TRAINING"
                  ? "Assigned Trainer"
                  : "Assigned Inspector"}
              </Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={responsibleId}
                onChange={(e) => {
                  setResponsibleId(e.target.value);
                  setConflictData(null);
                }}
              >
                <option value="">-- Select Personnel --</option>
                {selectedService?.serviceType === "TRAINING"
                  ? options?.trainers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.email}) — {t.role}
                      </option>
                    ))
                  : options?.inspectors.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.email}) — {i.role}
                      </option>
                    ))}
              </select>
            </div>

            {/* Service-Specific Fields */}
            {selectedService?.serviceType === "TRAINING" ? (
              <>
                <div className="space-y-2">
                  <Label>
                    Training Course <span className="text-red-500">*</span>
                  </Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Course --</option>
                    {options?.courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{c.code}] {c.title} {c.trainingHours ? `(${c.trainingHours} hrs)` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Location / Training Facility</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                  >
                    <option value="">-- Client Site / Default Location --</option>
                    {options?.locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        [{loc.code}] {loc.name} {loc.emirate ? `(${loc.emirate})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {options?.trainees && options.trainees.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      Enroll Trainees (Optional)
                    </Label>
                    <div className="max-h-36 overflow-y-auto border rounded-md p-2 space-y-1 bg-muted/20">
                      {options.trainees.map((tr) => (
                        <label
                          key={tr.id}
                          className="flex items-center gap-2 text-xs hover:bg-muted p-1 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTrainees.includes(tr.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTrainees([...selectedTrainees, tr.id]);
                              } else {
                                setSelectedTrainees(
                                  selectedTrainees.filter((id) => id !== tr.id)
                                );
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="font-medium">{tr.name}</span>
                          {tr.emiratesId && (
                            <span className="text-muted-foreground font-mono">
                              ({tr.emiratesId})
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Inspection Type</Label>
                  <Input
                    value={inspectionType}
                    onChange={(e) => setInspectionType(e.target.value)}
                    placeholder="e.g. Periodic Thorough Examination, Major Inspection"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Equipment Asset / Identifier</Label>
                  <Input
                    value={equipmentAsset}
                    onChange={(e) => setEquipmentAsset(e.target.value)}
                    placeholder="e.g. Overhead Crane #OC-04 (Asset 481)"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Location / Inspection Site</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                  >
                    <option value="">-- Client Premises / Default Location --</option>
                    {options?.locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        [{loc.code}] {loc.name} {loc.emirate ? `(${loc.emirate})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Special Instructions / Notes</Label>
              <Textarea
                placeholder="Access permissions, PPE requirements, client site contact, etc."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={2}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving Schedule...
                  </>
                ) : forceOverride ? (
                  "Override & Confirm Schedule"
                ) : (
                  "Confirm Schedule"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
