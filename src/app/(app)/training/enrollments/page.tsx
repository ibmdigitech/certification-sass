"use client";

import { useState, useEffect } from "react";
import { UserPlus, Search, Loader2, User, GraduationCap, Edit, Trash2, Eye, UploadCloud, Upload, Calendar, FileText, ImageIcon, IdCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { format } from "date-fns";

interface Trainee {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string | null;
}

interface Course {
  id: number;
  title: string;
  code: string | null;
}

interface Enrollment {
  id: number;
  status: string;
  enrolledAt: string;
  completedAt: string | null;
  trainee: Trainee;
  course: Course;
}

export default function TrainingEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDocDialogOpen, setIsDocDialogOpen] = useState(false);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [locations, setLocations] = useState<Array<{id: number; code: string; name: string}>>([]);
  const [formData, setFormData] = useState({
    traineeId: "",
    courseId: "",
    locationId: "",
    jobId: "",
    jobNumber: "",
    trainingDate: "",
    timesheetNumber: "",
    photoFile: null as File | null,
    idFile: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter) params.append("status", statusFilter);
      const res = await fetch(`/api/training/enrollments?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments || []);
      }
    } catch (error) {
      console.error("Failed to fetch enrollments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainees = async () => {
    try {
      const res = await fetch("/api/trainees");
      if (res.ok) {
        const data = await res.json();
        setTrainees(data.trainees || []);
      }
    } catch (error) {
      console.error("Failed to fetch trainees:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/training/courses?activeOnly=true");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/locations");
      if (res.ok) {
        const data = await res.json();
        setLocations(data.locations || []);
      }
    } catch (error) {
      console.error("Failed to fetch locations:", error);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchTrainees();
    fetchCourses();
    fetchLocations();
  }, []);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.traineeId) {
      errors.traineeId = "Please select a trainee";
    }
    if (!formData.courseId) {
      errors.courseId = "Please select a course";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const uploadFile = async (file: File, type: string): Promise<string | null> => {
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', type);
      const res = await fetch("/api/trainees/documents", {
        method: "POST",
        body: formDataUpload,
      });
      if (res.ok) {
        const data = await res.json();
        return data.url || null;
      }
      return null;
    } catch (error) {
      console.error("File upload failed:", error);
      return null;
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    setUploadingFiles(true);
    try {
      // Upload files first
      let photoUrl = "";
      let idUrl = "";
      if (formData.photoFile) {
        photoUrl = await uploadFile(formData.photoFile, "photo") || "";
      }
      if (formData.idFile) {
        idUrl = await uploadFile(formData.idFile, "id_document") || "";
      }

      const res = await fetch("/api/training/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          traineeId: parseInt(formData.traineeId),
          courseId: parseInt(formData.courseId),
          locationId: formData.locationId ? parseInt(formData.locationId) : undefined,
          jobId: formData.jobId ? parseInt(formData.jobId) : undefined,
          jobNumber: formData.jobNumber || undefined,
          trainingDate: formData.trainingDate || undefined,
          timesheetNumber: formData.timesheetNumber || undefined,
          photoUrl,
          idUrl,
        }),
      });
      if (res.ok) {
        setIsDialogOpen(false);
        resetForm();
        fetchEnrollments();
      } else {
        const error = await res.json();
        setFormErrors({ general: error.error || "Failed to enroll trainee" });
      }
    } catch (error) {
      console.error("Failed to enroll trainee:", error);
      setFormErrors({ general: "Failed to enroll trainee" });
    } finally {
      setSubmitting(false);
      setUploadingFiles(false);
    }
  };

  const resetForm = () => {
    setFormData({
      traineeId: "",
      courseId: "",
      locationId: "",
      jobId: "",
      jobNumber: "",
      trainingDate: "",
      timesheetNumber: "",
      photoFile: null,
      idFile: null,
    });
    setFormErrors({});
  };

  const openEnrollDialog = () => {
    resetForm();
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-emerald-500/15 text-emerald-500 border-emerald-500/20">
            Active
          </Badge>
        );
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "dropped":
        return (
          <Badge variant="secondary" className="bg-amber-500/15 text-amber-500 border-amber-500/20">
            Dropped
          </Badge>
        );
      case "withdrawn":
        return <Badge variant="destructive">Withdrawn</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredEnrollments = enrollments.filter((enrollment) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        `${enrollment.trainee.firstName} ${enrollment.trainee.lastName}`.toLowerCase().includes(query) ||
        enrollment.trainee.employeeId?.toLowerCase().includes(query) ||
        enrollment.course.title.toLowerCase().includes(query) ||
        enrollment.course.code?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training Enrollments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            View and manage trainee enrollments across all training courses.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={openEnrollDialog} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Enroll Trainee
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/documents/bulk-upload"} className="gap-2">
            <UploadCloud className="h-4 w-4" />
            Bulk Upload
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-4 w-full">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by trainee name, employee ID, course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="dropped">Dropped</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enroll Trainee in Course</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEnroll} className="space-y-4">
            {formErrors.general && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {formErrors.general}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="traineeId">Trainee *</Label>
              <Select
                value={formData.traineeId}
                onValueChange={(value) => setFormData({ ...formData, traineeId: value })}
              >
                <SelectTrigger aria-invalid={!!formErrors.traineeId}>
                  <SelectValue placeholder="Select trainee" />
                </SelectTrigger>
                <SelectContent>
                  {trainees.map((trainee) => (
                    <SelectItem key={trainee.id} value={String(trainee.id)}>
                      {trainee.firstName} {trainee.lastName}
                      {trainee.employeeId && ` (${trainee.employeeId})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.traineeId && (
                <p className="text-sm text-destructive">{formErrors.traineeId}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="courseId">Course *</Label>
              <Select
                value={formData.courseId}
                onValueChange={(value) => setFormData({ ...formData, courseId: value })}
              >
                <SelectTrigger aria-invalid={!!formErrors.courseId}>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={String(course.id)}>
                      {course.title}
                      {course.code && ` (${course.code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.courseId && (
                <p className="text-sm text-destructive">{formErrors.courseId}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="locationId">Location</Label>
              <Select
                value={formData.locationId}
                onValueChange={(value) => setFormData({ ...formData, locationId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific location</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>
                      {loc.name} ({loc.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="jobNumber">Job Number</Label>
                <Input
                  id="jobNumber"
                  value={formData.jobNumber}
                  onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })}
                  placeholder="e.g. JOB-2024-001"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timesheetNumber">Timesheet Number</Label>
                <Input
                  id="timesheetNumber"
                  value={formData.timesheetNumber}
                  onChange={(e) => setFormData({ ...formData, timesheetNumber: e.target.value })}
                  placeholder="e.g. TS-001"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="trainingDate">Training Date</Label>
              <Input
                id="trainingDate"
                type="date"
                value={formData.trainingDate}
                onChange={(e) => setFormData({ ...formData, trainingDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="photoFile">Photo Upload</Label>
                <Input
                  id="photoFile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setFormData({ ...formData, photoFile: file });
                  }}
                />
                {formData.photoFile && (
                  <p className="text-xs text-muted-foreground">{formData.photoFile.name}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="idFile">ID Document Upload</Label>
                <Input
                  id="idFile"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setFormData({ ...formData, idFile: file });
                  }}
                />
                {formData.idFile && (
                  <p className="text-xs text-muted-foreground">{formData.idFile.name}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
                disabled={submitting || uploadingFiles}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || uploadingFiles}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploadingFiles && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploadingFiles ? "Uploading files..." : "Enroll Trainee"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="pt-0">
          {loading ? (
            <div className="py-12">
              <LoadingState message="Loading enrollments..." />
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No enrollments found"
              description={
                searchQuery || statusFilter
                  ? "Try adjusting your search or filters."
                  : "Enroll trainees in courses to start tracking their training progress."
              }
              action={
                <Button onClick={openEnrollDialog}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Enroll Trainee
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trainee</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enrolled Date</TableHead>
                    <TableHead>Completed Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {enrollment.trainee.firstName} {enrollment.trainee.lastName}
                            </p>
                            {enrollment.trainee.employeeId && (
                              <p className="text-sm text-muted-foreground">
                                ID: {enrollment.trainee.employeeId}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{enrollment.course.title}</p>
                          {enrollment.course.code && (
                            <p className="text-sm text-muted-foreground">
                              Code: {enrollment.course.code}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(enrollment.enrolledAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {enrollment.completedAt
                          ? format(new Date(enrollment.completedAt), "MMM dd, yyyy")
                          : "-"}
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