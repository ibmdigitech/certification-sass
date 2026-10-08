"use client";

import { useState, useEffect } from "react";
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
import { Plus, Search, GraduationCap, Edit, Trash2, Eye, BookOpen, CheckCircle2, XCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface Course {
  id: number;
  title: string;
  description: string | null;
  code: string | null;
  status: string;
  category: string | null;
  duration: number | null;
  credits: number | null;
  tags: string[];
  _count: {
    enrollments: number;
    modules: number;
  };
  createdAt: string;
}

interface Module {
  id: number;
  title: string;
  description: string | null;
  order: number;
  duration: number | null;
  _count: {
    lessons: number;
  };
}

interface Lesson {
  id: number;
  title: string;
  description: string | null;
  type: string;
  order: number;
  duration: number | null;
  isRequired: boolean;
  assessments: Array<{
    id: number;
    title: string;
    _count: { questions: number };
  }>;
}

export default function TrainingPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [view, setView] = useState<"courses" | "modules" | "lessons">("courses");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    code: "",
    duration: "",
    credits: "",
    status: "draft",
    category: "",
    tags: "",
  });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter) params.append("status", statusFilter);
      const res = await fetch(`/api/training/courses?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || data);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async (courseId: number) => {
    try {
      const res = await fetch(`/api/training/modules?courseId=${courseId}`);
      if (res.ok) {
        const data = await res.json();
        setModules(data.modules || []);
      }
    } catch (error) {
      console.error("Failed to fetch modules:", error);
    }
  };

  const fetchLessons = async (moduleId: number) => {
    try {
      const res = await fetch(`/api/training/lessons?moduleId=${moduleId}`);
      if (res.ok) {
        const data = await res.json();
        setLessons(data.lessons || []);
      }
    } catch (error) {
      console.error("Failed to fetch lessons:", error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    if (selectedCourse) {
      fetchModules(selectedCourse.id);
    } else {
      setModules([]);
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedModule) {
      fetchLessons(selectedModule.id);
    } else {
      setLessons([]);
    }
  }, [selectedModule]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/training/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          duration: formData.duration ? parseInt(formData.duration) : undefined,
          credits: formData.credits ? parseInt(formData.credits) : undefined,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setIsDialogOpen(false);
        resetForm();
        fetchCourses();
      }
    } catch (error) {
      console.error("Failed to create course:", error);
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    try {
      const res = await fetch(`/api/training/courses/${editingCourse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          duration: formData.duration ? parseInt(formData.duration) : undefined,
          credits: formData.credits ? parseInt(formData.credits) : undefined,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setIsDialogOpen(false);
        setEditingCourse(null);
        resetForm();
        fetchCourses();
      }
    } catch (error) {
      console.error("Failed to update course:", error);
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      const res = await fetch(`/api/training/courses/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCourses();
      }
    } catch (error) {
      console.error("Failed to delete course:", error);
    }
  };

  const handlePublishCourse = async (id: number) => {
    try {
      const res = await fetch(`/api/training/courses/${id}/publish`, { method: "POST" });
      if (res.ok) {
        fetchCourses();
      }
    } catch (error) {
      console.error("Failed to publish course:", error);
    }
  };

  const openCreateDialog = () => {
    setEditingCourse(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description || "",
      code: course.code || "",
      duration: course.duration?.toString() || "",
      credits: course.credits?.toString() || "",
      status: course.status,
      category: course.category || "",
      tags: course.tags.join(", "),
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      code: "",
      duration: "",
      credits: "",
      status: "draft",
      category: "",
      tags: "",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published": return <Badge variant="default" className="bg-emerald-500/15 text-emerald-500 border-emerald-500/20">Published</Badge>;
      case "draft": return <Badge variant="outline">Draft</Badge>;
      case "archived": return <Badge variant="secondary">Archived</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (view === "modules" && selectedCourse) {
    return (
      <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
        <PageHeader
          title={selectedCourse.title}
          description={selectedCourse.description || undefined}
          action={
            <Button onClick={() => setView("courses")} variant="ghost" size="sm">
              ← Back to Courses
            </Button>
          }
        />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Modules ({modules.length})</CardTitle>
            <Button onClick={() => alert("Create module - implement dialog")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Module
            </Button>
          </CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No modules yet"
                description="Create your first module to start building the course structure."
                action={
                  <Button onClick={() => alert("Create module - implement dialog")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Module
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Lessons</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell>{module.order}</TableCell>
                      <TableCell className="font-medium">{module.title}</TableCell>
                      <TableCell>{module.description || "-"}</TableCell>
                      <TableCell>{module.duration ? `${module.duration} min` : "-"}</TableCell>
                      <TableCell>{module._count.lessons}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedModule(module); setView("lessons"); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === "lessons" && selectedModule) {
    return (
      <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
        <PageHeader
          title={selectedModule.title}
          description={selectedModule.description || undefined}
          action={
            <Button onClick={() => setView("modules")} variant="ghost" size="sm">
              ← Back to Modules
            </Button>
          }
        />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lessons ({lessons.length})</CardTitle>
            <Button onClick={() => alert("Create lesson - implement dialog")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Lesson
            </Button>
          </CardHeader>
          <CardContent>
            {lessons.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No lessons yet"
                description="Create your first lesson to start adding content."
                action={
                  <Button onClick={() => alert("Create lesson - implement dialog")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Lesson
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Assessments</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessons.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell>{lesson.order}</TableCell>
                      <TableCell className="font-medium">{lesson.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{lesson.type}</Badge>
                      </TableCell>
                      <TableCell>{lesson.duration ? `${lesson.duration} min` : "-"}</TableCell>
                      <TableCell>{lesson.isRequired ? "Yes" : "No"}</TableCell>
                      <TableCell>{lesson.assessments.length}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Training Programs"
        description="Manage training programs, courses, modules, and lessons."
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingCourse ? "Edit Course" : "Create New Course"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Title *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Course title"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Code</label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g. SAF-101"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Category</label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Safety, Technical, Compliance"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Duration (minutes)</label>
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="Total course duration"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Credits</label>
                    <Input
                      type="number"
                      value={formData.credits}
                      onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                      placeholder="Credit hours"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Tags (comma separated)</label>
                    <Input
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="safety, certification, required"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Course description"
                      className="min-h-[100px] flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); setEditingCourse(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCourse ? "Update" : "Create"} Course
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-base"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="pt-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading...</div>
          ) : courses.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No training courses yet"
              description="Create your first training course to start managing modules, lessons, and assessments."
              action={
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Training Course
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Enrollments</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>{course.code || "-"}</TableCell>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell>{course.category || "-"}</TableCell>
                    <TableCell>{getStatusBadge(course.status)}</TableCell>
                    <TableCell>{course.duration ? `${course.duration} min` : "-"}</TableCell>
                    <TableCell>{course._count.modules}</TableCell>
                    <TableCell>{course._count.enrollments}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedCourse(course); setView("modules"); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(course)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {course.status === "draft" && (
                        <Button variant="ghost" size="icon" onClick={() => handlePublishCourse(course.id)}>
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteCourse(course.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}