"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, GraduationCap, Edit, Trash2, Eye, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Course {
  id: number;
  title: string;
  description: string | null;
  code: string | null;
  status: string;
  category: string | null;
  courseType: string | null;
  duration: number | null;
  trainingHours: number | null;
  credits: number | null;
  certificateValidityMonths: number | null;
  tags: string[];
  location: { id: number; code: string; name: string } | null;
  _count: {
    enrollments: number;
    modules: number;
  };
  createdAt: string;
}

export default function TrainingCourseMasterPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [locations, setLocations] = useState<Array<{id: number; code: string; name: string}>>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    code: "",
    duration: "",
    trainingHours: "",
    credits: "",
    certificateValidityMonths: "",
    status: "ACTIVE",
    category: "",
    courseType: "OPERATOR",
    tags: "",
    locationId: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter) params.append("status", statusFilter);
      if (categoryFilter) params.append("category", categoryFilter);
      if (locationFilter) params.append("locationId", locationFilter);
      const res = await fetch(`/api/training/courses?${params}`);
      if (res.ok) {
        const data = await res.json();
        const coursesData = data.courses || data;
        // Sort alphabetically by title
        const sortedCourses = [...coursesData].sort((a, b) => a.title.localeCompare(b.title));
        setCourses(sortedCourses);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [searchQuery, statusFilter, categoryFilter, locationFilter]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) {
      errors.title = "Course name is required";
    }
    if (formData.code && !/^[A-Z0-9-]+$/i.test(formData.code)) {
      errors.code = "Course code can only contain letters, numbers, and hyphens";
    }
    // Check for duplicate name (case-insensitive)
    const duplicateCourse = courses.find(
      (c) =>
        c.title.toLowerCase().trim() === formData.title.toLowerCase().trim() &&
        c.id !== (editingCourse?.id ?? -1)
    );
    if (duplicateCourse) {
      errors.title = "A course with this name already exists";
    }
    // Check for duplicate code
    if (formData.code) {
      const duplicateCode = courses.find(
        (c) =>
          c.code?.toLowerCase() === formData.code.toLowerCase() &&
          c.id !== (editingCourse?.id ?? -1)
      );
      if (duplicateCode) {
        errors.code = "A course with this code already exists";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/training/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          code: formData.code.trim() || undefined,
          duration: formData.duration ? parseInt(formData.duration) : undefined,
          trainingHours: formData.trainingHours ? parseInt(formData.trainingHours) : undefined,
          credits: formData.credits ? parseInt(formData.credits) : undefined,
          certificateValidityMonths: formData.certificateValidityMonths ? parseInt(formData.certificateValidityMonths) : undefined,
          status: formData.status,
          category: formData.category.trim() || undefined,
          courseType: formData.courseType,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
          locationId: formData.locationId ? parseInt(formData.locationId) : undefined,
        }),
      });
      if (res.ok) {
        setIsDialogOpen(false);
        resetForm();
        fetchCourses();
      } else {
        const error = await res.json();
        setFormErrors({ title: error.error || "Failed to create course" });
      }
    } catch (error) {
      console.error("Failed to create course:", error);
      setFormErrors({ title: "Failed to create course" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !editingCourse) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/training/courses/${editingCourse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          code: formData.code.trim() || undefined,
          duration: formData.duration ? parseInt(formData.duration) : undefined,
          trainingHours: formData.trainingHours ? parseInt(formData.trainingHours) : undefined,
          credits: formData.credits ? parseInt(formData.credits) : undefined,
          certificateValidityMonths: formData.certificateValidityMonths ? parseInt(formData.certificateValidityMonths) : undefined,
          status: formData.status,
          category: formData.category.trim() || undefined,
          courseType: formData.courseType,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
          locationId: formData.locationId ? parseInt(formData.locationId) : undefined,
        }),
      });
      if (res.ok) {
        setIsDialogOpen(false);
        setEditingCourse(null);
        resetForm();
        fetchCourses();
      } else {
        const error = await res.json();
        setFormErrors({ title: error.error || "Failed to update course" });
      }
    } catch (error) {
      console.error("Failed to update course:", error);
      setFormErrors({ title: "Failed to update course" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/training/courses/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCourses();
      }
    } catch (error) {
      console.error("Failed to delete course:", error);
    }
  };

  const handleToggleStatus = async (course: Course) => {
    const newStatus = course.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/training/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchCourses();
      }
    } catch (error) {
      console.error("Failed to update course status:", error);
    }
  };

  const openCreateDialog = () => {
    setEditingCourse(null);
    resetForm();
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description || "",
      code: course.code || "",
      duration: course.duration?.toString() || "",
      trainingHours: course.trainingHours?.toString() || "",
      credits: course.credits?.toString() || "",
      certificateValidityMonths: course.certificateValidityMonths?.toString() || "",
      status: course.status,
      category: course.category || "",
      courseType: course.courseType || "OPERATOR",
      tags: course.tags.join(", "),
      locationId: course.location?.id?.toString() || "",
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      code: "",
      duration: "",
      trainingHours: "",
      credits: "",
      certificateValidityMonths: "",
      status: "ACTIVE",
      category: "",
      courseType: "OPERATOR",
      tags: "",
      locationId: "",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="default" className="bg-emerald-500/15 text-emerald-500 border-emerald-500/20">Active</Badge>;
      case "INACTIVE":
        return <Badge variant="secondary">Inactive</Badge>;
      case "DRAFT":
        return <Badge variant="outline">Draft</Badge>;
      case "PENDING_VERIFICATION":
        return <Badge variant="secondary" className="bg-amber-500/15 text-amber-500 border-amber-500/20">Pending Verification</Badge>;
      case "ARCHIVED":
        return <Badge variant="secondary" className="bg-slate-500/15 text-slate-500">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const categories = useMemo(() => 
    Array.from(new Set(courses.map(c => c.category).filter(Boolean) as string[])).sort()
  , [courses]);

  const courseTypes = useMemo(() => 
    Array.from(new Set(courses.map(c => c.courseType).filter(Boolean) as string[])).sort()
  , [courses]);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Training Course Master"
        description="Manage training certification courses. Add, edit, and organize all training courses."
        action={
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            + Add More Course
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edit Training Course" : "Add New Training Course"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse} className="space-y-4">
            {Object.keys(formErrors).length > 0 && (
              <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                Please fix the errors below before submitting.
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="title">Course Name *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. EXCAVATOR OPERATOR"
                  required
                  aria-invalid={!!formErrors.title}
                  aria-describedby={formErrors.title ? "title-error" : undefined}
                />
                {formErrors.title && <p id="title-error" className="text-sm text-destructive">{formErrors.title}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Course Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. EXC-001"
                  aria-invalid={!!formErrors.code}
                  aria-describedby={formErrors.code ? "code-error" : undefined}
                />
                {formErrors.code && <p id="code-error" className="text-sm text-destructive">{formErrors.code}</p>}
                <p className="text-xs text-muted-foreground">Optional, unique if provided. Letters, numbers, and hyphens only.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Operator", "Safety", "Inspector", "Technical", "Compliance", "Fire Safety", "Electrical", "Mechanical"].map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="courseType">Course Type</Label>
                <Select
                  value={formData.courseType}
                  onValueChange={(value) => setFormData({ ...formData, courseType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {["OPERATOR", "SAFETY", "INSPECTION", "TECHNICAL", "COMPLIANCE"].map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={String(loc.id)}>{loc.name} ({loc.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="Total course duration in minutes"
                  min="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="trainingHours">Training Hours</Label>
                <Input
                  id="trainingHours"
                  type="number"
                  value={formData.trainingHours}
                  onChange={(e) => setFormData({ ...formData, trainingHours: e.target.value })}
                  placeholder="Training hours"
                  min="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="credits">Credits</Label>
                <Input
                  id="credits"
                  type="number"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                  placeholder="Credit hours"
                  min="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="certificateValidityMonths">Certificate Validity / Expiry Period (months)</Label>
                <Input
                  id="certificateValidityMonths"
                  type="number"
                  value={formData.certificateValidityMonths}
                  onChange={(e) => setFormData({ ...formData, certificateValidityMonths: e.target.value })}
                  placeholder="e.g. 24, 36 (leave empty for no expiry)"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">Optional. Leave empty for courses without expiry.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="safety, certification, required, operator"
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="description">Course Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the training course..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); setEditingCourse(null); setFormErrors({}); }} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingCourse ? "Update" : "Save"} Course
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses by name or code..."
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
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Locations</SelectItem>
              {locations.map(loc => (
                <SelectItem key={loc.id} value={String(loc.id)}>{loc.name} ({loc.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="pt-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No training courses yet"
              description="Create your first training course to start managing training programs and certifications."
              action={
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  + Add More Course
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Training Hrs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Modules</TableHead>
                    <TableHead>Enrollments</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell className="font-mono text-sm">{course.code || "-"}</TableCell>
                      <TableCell>{course.category || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{course.courseType || "-"}</Badge>
                      </TableCell>
                      <TableCell>{course.location ? `${course.location.name} (${course.location.code})` : <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        {course.certificateValidityMonths ? `${course.certificateValidityMonths} months` : <span className="text-muted-foreground">No expiry</span>}
                      </TableCell>
                      <TableCell>{course.duration ? `${course.duration} min` : "-"}</TableCell>
                      <TableCell>{course.trainingHours ? `${course.trainingHours} hrs` : "-"}</TableCell>
                      <TableCell>{getStatusBadge(course.status)}</TableCell>
                      <TableCell>{course._count.modules}</TableCell>
                      <TableCell>{course._count.enrollments}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(course)} title="Edit course">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(course)}
                          title={course.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          className={course.status === "ACTIVE" ? "text-emerald-600" : "text-amber-600"}
                        >
                          {course.status === "ACTIVE" ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteCourse(course.id)} title="Delete course">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

export const dynamic = "force-dynamic";