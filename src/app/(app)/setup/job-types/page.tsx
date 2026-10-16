"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, ShieldCheck, CheckCircle2, XCircle, Loader2, Edit, Trash2, AlertTriangle } from "lucide-react";
import { AlertBanner } from "@/components/ui/alert-banner";
import { ConfirmDialog } from "@/components/jobs/ConfirmDialog";

interface JobTypeRecord {
  id: number;
  category: string;
  code: string;
  description: string;
  accreditationStandard: string | null;
  subContractorAllowed: boolean;
  standardFee: number | null;
  defaultValidityMonths: number;
  checklistRef: string | null;
  certificateFormRef: string | null;
  isActive: boolean;
}

export default function JobPerformingTypesPage() {
  const [category, setCategory] = useState("EIAC");
  const [types, setTypes] = useState<JobTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit dialog state
  const [editingType, setEditingType] = useState<JobTypeRecord | null>(null);
  const [editForm, setEditForm] = useState({ code: "", description: "", standard: "", fee: "", checklistRef: "", certRef: "", subContractorAllowed: false, defaultValidityMonths: 12, isActive: true });

  // Deactivation confirm
  const [deactivateTarget, setDeactivateTarget] = useState<JobTypeRecord | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [standard, setStandard] = useState("");
  const [fee, setFee] = useState("");
  const [checklistRef, setChecklistRef] = useState("");
  const [certRef, setCertRef] = useState("");
  const [subContractorAllowed, setSubContractorAllowed] = useState(false);
  const [defaultValidityMonths, setDefaultValidityMonths] = useState(12);

  const fetchJobTypes = async (cat: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/setup/job-types?category=${cat}&includeInactive=true`);
      if (!res.ok) {
        if (res.status === 401) {
          setError("You are not authorized to view job types.");
          return;
        }
        throw new Error("Failed to fetch job types");
      }
      const json = await res.json();
      setTypes(json.jobTypes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load job types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobTypes(category);
  }, [category]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!description) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/setup/job-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          code,
          description,
          accreditationStandard: standard,
          standardFee: fee,
          checklistRef,
          certificateFormRef: certRef,
          subContractorAllowed,
          defaultValidityMonths,
        }),
      });
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "A job type with this code already exists.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add job type");
      }
      setIsDialogOpen(false);
      setCode("");
      setDescription("");
      setStandard("");
      setFee("");
      setChecklistRef("");
      setCertRef("");
      setSubContractorAllowed(false);
      setDefaultValidityMonths(12);
      fetchJobTypes(category);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add job type");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (t: JobTypeRecord) => {
    setEditingType(t);
    setEditForm({
      code: t.code,
      description: t.description,
      standard: t.accreditationStandard || "",
      fee: t.standardFee != null ? String(t.standardFee) : "",
      checklistRef: t.checklistRef || "",
      certRef: t.certificateFormRef || "",
      subContractorAllowed: t.subContractorAllowed,
      defaultValidityMonths: t.defaultValidityMonths || 12,
      isActive: t.isActive,
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!editingType) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/setup/job-types", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingType.id,
          code: editForm.code,
          description: editForm.description,
          accreditationStandard: editForm.standard,
          standardFee: editForm.fee,
          checklistRef: editForm.checklistRef,
          certificateFormRef: editForm.certRef,
          subContractorAllowed: editForm.subContractorAllowed,
          defaultValidityMonths: editForm.defaultValidityMonths,
          isActive: editForm.isActive,
        }),
      });
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "A job type with this code already exists.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update job type");
      }
      setEditingType(null);
      fetchJobTypes(category);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update job type");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setIsDeactivating(true);
    setError(null);
    try {
      const res = await fetch("/api/setup/job-types", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deactivateTarget.id, isActive: false }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to deactivate job type");
      }
      setDeactivateTarget(null);
      fetchJobTypes(category);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate job type");
    } finally {
      setIsDeactivating(false);
    }
  };

  const filtered = types.filter(
    (t) =>
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      (t.accreditationStandard && t.accreditationStandard.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header matching Screenshot Page 3 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Job Performing Types</h1>
          <p className="text-sm text-muted-foreground">
            Accreditation scopes, inspection checklists, certificate form templates, and standard fee matrix
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Job Performing Type ({category})</DialogTitle>
              <DialogDescription>
                Define an equipment inspection scope and bind it to standard checklist and certificate forms.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="code">Job Type Code *</Label>
                  <Input
                    id="code"
                    placeholder={`e.g. TSC-${category}-015`}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fee">Standard Fee (AED)</Label>
                  <Input
                    id="fee"
                    type="number"
                    placeholder="e.g. 1500"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="desc">Type / Description *</Label>
                <Input
                  id="desc"
                  placeholder="e.g. Overhead Travelling Crane (Double Girder)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="standard">Accredited Standard / SOP Reference</Label>
                <Input
                  id="standard"
                  placeholder={`e.g. TSC-${category}-SOP-015 Rev 02`}
                  value={standard}
                  onChange={(e) => setStandard(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="chk">Checklist Form Ref</Label>
                  <Input
                    id="chk"
                    placeholder={`e.g. TSC-${category}-CHK-015`}
                    value={checklistRef}
                    onChange={(e) => setChecklistRef(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rep">Certificate Form Ref</Label>
                  <Input
                    id="rep"
                    placeholder={`e.g. TSC-${category}-REP-015`}
                    value={certRef}
                    onChange={(e) => setCertRef(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Job Type
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <AlertBanner variant="error" title="Error" description={error} />}

      {/* Tabs matching Screenshot Page 3 */}
      <Tabs
        value={category}
        onValueChange={(val) => {
          setCategory(val);
        }}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="EIAC">EIAC - Job Types</TabsTrigger>
            <TabsTrigger value="ENAS">ENAS - Job Types</TabsTrigger>
            <TabsTrigger value="OTHER">Other Technical Scopes</TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search types, codes, SOPs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <TabsContent value={category} className="m-0">
          <Card className="overflow-hidden border shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-12 font-bold text-xs">#</TableHead>
                    <TableHead className="font-bold text-xs">Code</TableHead>
                    <TableHead className="font-bold text-xs min-w-[200px]">Type / Description</TableHead>
                    <TableHead className="font-bold text-xs">Accredited SOP / Standard</TableHead>
                    <TableHead className="font-bold text-xs text-center">Sub-Contractor</TableHead>
                    <TableHead className="font-bold text-xs text-right">Fee (AED)</TableHead>
                    <TableHead className="font-bold text-xs">Checklist Ref</TableHead>
                    <TableHead className="font-bold text-xs">Cert Form Ref</TableHead>
                    <TableHead className="font-bold text-xs text-center">Active</TableHead>
                    <TableHead className="font-bold text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-32 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-2 block">Loading {category} job types...</span>
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center text-xs text-muted-foreground">
                        No job types found for {category}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((item, index) => (
                      <TableRow key={item.id} className="hover:bg-muted/20 text-xs">
                        <TableCell className="font-mono text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-mono font-semibold">{item.code}</TableCell>
                        <TableCell className="font-medium text-foreground">{item.description}</TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground">
                          {item.accreditationStandard || "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.subContractorAllowed ? (
                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              No
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {item.standardFee ? `${item.standardFee.toLocaleString()}` : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground">
                          {item.checklistRef || "—"}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground">
                          {item.certificateFormRef || "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.isActive ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)}>
                              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            {item.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => setDeactivateTarget(item)}
                                title="Deactivate (preserves records in use)"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingType} onOpenChange={(o) => !o && setEditingType(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Job Type #{editingType?.id}</DialogTitle>
            <DialogDescription>
              Update scope, standard references, and fee. Changes are audited.
            </DialogDescription>
          </DialogHeader>
          {error && <AlertBanner variant="error" title="Error" description={error} />}
          <form onSubmit={handleEdit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="editCode">Job Type Code *</Label>
                <Input
                  id="editCode"
                  value={editForm.code}
                  onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editFee">Standard Fee (AED)</Label>
                <Input
                  id="editFee"
                  type="number"
                  value={editForm.fee}
                  onChange={(e) => setEditForm((f) => ({ ...f, fee: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="editDesc">Type / Description *</Label>
              <Input
                id="editDesc"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="editStandard">Accredited Standard / SOP Reference</Label>
              <Input
                id="editStandard"
                value={editForm.standard}
                onChange={(e) => setEditForm((f) => ({ ...f, standard: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="editChk">Checklist Form Ref</Label>
                <Input
                  id="editChk"
                  value={editForm.checklistRef}
                  onChange={(e) => setEditForm((f) => ({ ...f, checklistRef: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editRep">Certificate Form Ref</Label>
                <Input
                  id="editRep"
                  value={editForm.certRef}
                  onChange={(e) => setEditForm((f) => ({ ...f, certRef: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="editValidity">Default Validity (months)</Label>
                <Input
                  id="editValidity"
                  type="number"
                  value={editForm.defaultValidityMonths}
                  onChange={(e) => setEditForm((f) => ({ ...f, defaultValidityMonths: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editActive">Status</Label>
                <Select
                  value={editForm.isActive ? "active" : "inactive"}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, isActive: v === "active" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setEditingType(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation */}
      <ConfirmDialog
        open={!!deactivateTarget}
        title={`Deactivate ${deactivateTarget?.code ?? ""}`}
        description="Deactivating hides this job type from new job orders. Existing job orders and certificates that reference it are preserved. This is preferred over deletion for in-use reference records."
        confirmLabel="Deactivate"
        variant="destructive"
        isLoading={isDeactivating}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}
