"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Award, Plus, Search, Edit, Trash2, Save, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Competency {
  id: number;
  companyId: number;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  validityMonths: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    courseCompetencies: number;
    traineeCompetencies: number;
  };
}

interface PaginatedCompetencies {
  competencies: Competency[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function CompetenciesPage() {
  const [data, setData] = useState<PaginatedCompetencies | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    category: "",
    validityMonths: "",
    status: "ACTIVE",
  });

  const fetchCompetencies = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("pageSize", "20");
      if (searchQuery) params.append("search", searchQuery);
      if (categoryFilter) params.append("category", categoryFilter);

      const res = await fetch(`/api/training/competencies?${params}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch competencies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetencies();
  }, [searchQuery, categoryFilter]);

  const openCreateDialog = () => {
    setEditingCompetency(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      category: "",
      validityMonths: "",
      status: "ACTIVE",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (competency: Competency) => {
    setEditingCompetency(competency);
    setFormData({
      code: competency.code,
      name: competency.name,
      description: competency.description || "",
      category: competency.category || "",
      validityMonths: competency.validityMonths ? String(competency.validityMonths) : "",
      status: competency.status,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCompetency
        ? `/api/training/competencies/${editingCompetency.id}`
        : "/api/training/competencies";
      const method = editingCompetency ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category || undefined,
        validityMonths: formData.validityMonths ? Number(formData.validityMonths) : undefined,
        status: formData.status,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Failed to save competency");
      }

      setIsDialogOpen(false);
      fetchCompetencies(data?.page ?? 1);
    } catch (error) {
      console.error("Error saving competency:", error);
    }
  };

  const handleDelete = async (competency: Competency) => {
    if (!confirm(`Delete competency "${competency.name}"?`)) return;
    try {
      const res = await fetch(`/api/training/competencies/${competency.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchCompetencies(data?.page ?? 1);
    } catch (error) {
      console.error("Error deleting competency:", error);
    }
  };

  const categories = Array.from(
    new Set(data?.competencies.map((c) => c.category).filter(Boolean) as string[])
  );

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Competencies"
        description="Manage competency frameworks and track trainee certifications."
        action={
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Competency
          </Button>
        }
      />

      <div className="flex flex-wrap gap-4 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search competencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value || "")}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !data?.competencies?.length ? (
        <EmptyState
          icon={Award}
          title="No competencies found"
          description="Create competencies to track trainee skills and certifications."
          action={
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Competency
            </Button>
          }
        />
      ) : (
        <>
          <Card>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Trainees</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.competencies.map((competency) => (
                    <TableRow key={competency.id}>
                      <TableCell className="font-mono text-sm">{competency.code}</TableCell>
                      <TableCell className="font-medium">{competency.name}</TableCell>
                      <TableCell>{competency.category || "-"}</TableCell>
                      <TableCell>
                        {competency.validityMonths ? `${competency.validityMonths} months` : "N/A"}
                      </TableCell>
                      <TableCell>{competency._count.traineeCompetencies}</TableCell>
                      <TableCell>{competency._count.courseCompetencies}</TableCell>
                      <TableCell>
                        <Badge variant={competency.status === "ACTIVE" ? "default" : "secondary"}>
                          {competency.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(competency)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(competency)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {data.totalPages > 1 && (
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => fetchCompetencies(data.page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.totalPages}
                onClick={() => fetchCompetencies(data.page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCompetency ? "Edit Competency" : "Add Competency"}</DialogTitle>
            <DialogDescription>
              {editingCompetency ? "Update competency details" : "Create a new competency framework entry"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Code</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. SAFE-001"
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Competency name"
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Category</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Safety, Electrical, Mechanical"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Validity (months)</label>
              <Input
                type="number"
                value={formData.validityMonths}
                onChange={(e) => setFormData({ ...formData, validityMonths: e.target.value })}
                placeholder="e.g. 24"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCompetency ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const dynamic = "force-dynamic";