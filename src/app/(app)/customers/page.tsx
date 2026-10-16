"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
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
import { AlertBanner } from "@/components/ui/alert-banner";
import {
  Building2,
  Search,
  Plus,
  Briefcase,
  FileText,
  Phone,
  Mail,
  Loader2,
  ExternalLink,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface CustomerRecord {
  id: number;
  name: string | null;
  code: string | null;
  contact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  creditTerms: string | null;
  trnNumber: string | null;
  sites: { id: number; name: string; emirate: string | null }[];
  _count?: {
    sites: number;
    assets: number;
    jobs: number;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });

  // Form states (create)
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [creditTerms, setCreditTerms] = useState("30 Days");
  const [siteName, setSiteName] = useState("");
  const [emirate, setEmirate] = useState("Dubai");

  // Edit form state
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [editForm, setEditForm] = useState({ name: "", code: "", contact: "", email: "", phone: "", address: "", creditTerms: "", status: "active" });

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      params.append("page", String(pagination.page));
      params.append("limit", String(pagination.limit));

      const res = await fetch(`/api/customers?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) {
          setError("You are not authorized to view customers.");
          return;
        }
        throw new Error("Failed to fetch customers");
      }
      const json = await res.json();
      setCustomers(json.customers || []);
      setPagination((p) => ({ ...p, total: json.total ?? 0, totalPages: json.totalPages ?? 0 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name && !contact) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code,
          contact,
          email,
          phone,
          address,
          creditTerms,
          trnNumber: undefined,
          siteName: siteName || `${name} Main Facility`,
          emirate,
        }),
      });
      if (res.status === 409) {
        const data = await res.json();
        setError(data.error || "A duplicate customer record already exists.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create customer");
      }
      setIsDialogOpen(false);
      setName("");
      setCode("");
      setContact("");
      setEmail("");
      setPhone("");
      setAddress("");
      setSiteName("");
      setPagination((p) => ({ ...p, page: 1 }));
      fetchCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create customer");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (c: CustomerRecord) => {
    setEditingCustomer(c);
    setEditForm({
      name: c.name || "",
      code: c.code || "",
      contact: c.contact || "",
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
      creditTerms: c.creditTerms || "30 Days",
      status: c.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!editingCustomer) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingCustomer.id, ...editForm }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update customer");
      }
      setIsEditDialogOpen(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update customer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Directory & Enterprise Sites</h1>
          <p className="text-sm text-muted-foreground">
            Manage commercial clients, registered equipment assets, and multi-site inspection records
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Register New Customer</DialogTitle>
              <DialogDescription>
                Create a corporate account and attach its initial primary operating site. Duplicates are detected automatically.
              </DialogDescription>
            </DialogHeader>
            {error && isDialogOpen && <AlertBanner variant="error" title="Cannot create customer" description={error} />}
            <form onSubmit={handleCreateCustomer} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="companyName">Company / Customer Name *</Label>
                <Input
                  id="companyName"
                  placeholder="e.g. Al Habtoor Grand Resort LLC"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="custCode">Customer Code</Label>
                  <Input
                    id="custCode"
                    placeholder="e.g. CUST-HBT-01"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="credit">Credit Terms</Label>
                  <Select value={creditTerms} onValueChange={setCreditTerms}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Immediate">Immediate / Cash</SelectItem>
                      <SelectItem value="30 Days">30 Days</SelectItem>
                      <SelectItem value="60 Days">60 Days</SelectItem>
                      <SelectItem value="90 Days">90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="contactName">Contact Person</Label>
                  <Input
                    id="contactName"
                    placeholder="e.g. Eng. Tariq"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contactPhone">Phone</Label>
                  <Input
                    id="contactPhone"
                    placeholder="+971 50 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="operations@client.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div className="space-y-1">
                  <Label htmlFor="siteName">Primary Site / Yard Name</Label>
                  <Input
                    id="siteName"
                    placeholder="e.g. Jebel Ali Industrial Yard"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emirate">Emirate</Label>
                  <Select value={emirate} onValueChange={setEmirate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Emirate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dubai">Dubai (EIAC)</SelectItem>
                      <SelectItem value="Abu Dhabi">Abu Dhabi (ENAS)</SelectItem>
                      <SelectItem value="Sharjah">Sharjah</SelectItem>
                      <SelectItem value="Ajman">Ajman</SelectItem>
                      <SelectItem value="Ras Al Khaimah">Ras Al Khaimah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Customer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && !isDialogOpen && <AlertBanner variant="error" title="Error" description={error} />}

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card p-3 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers by name, code, contact, email, phone, or TRN..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Customer Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse h-40 bg-muted/40" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <Card className="text-center p-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-base font-semibold">No Customers Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {search ? `No customer matching "${search}" was found.` : "Register your first enterprise customer to begin issuing quotations and job orders."}
          </p>
          <Button onClick={() => setIsDialogOpen(true)} className="mt-4" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Customer
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map((c) => {
              const isActive = c.status === "active";
              const displayName = c.name || c.contact || "Unnamed Customer";
              const siteCount = c._count?.sites ?? c.sites?.length ?? 0;
              const assetCount = c._count?.assets ?? 0;
              const jobCount = c._count?.jobs ?? 0;

              return (
                <Card key={c.id} className="hover:shadow-md transition border flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                              isActive ? "bg-emerald-500 shadow-sm" : "bg-red-400"
                            }`}
                          />
                          <CardTitle className="text-sm font-bold uppercase tracking-tight line-clamp-1">
                            {displayName}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono">{c.code || `ID #${c.id}`}</span>
                          {c.creditTerms && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                              {c.creditTerms}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2.5 text-xs text-muted-foreground pb-3">
                    {c.contact && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">{c.contact}</span>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t flex items-center justify-between text-[11px] font-medium text-foreground">
                      <span>{siteCount} Site{siteCount !== 1 ? "s" : ""}</span>
                      <span>{assetCount} Asset{assetCount !== 1 ? "s" : ""}</span>
                      <span>{jobCount} Job{jobCount !== 1 ? "s" : ""}</span>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2 border-t bg-muted/20 flex items-center justify-between text-xs">
                    <Badge variant={isActive ? "secondary" : "destructive"} className="text-[10px]">
                      {isActive ? "Active Account" : c.status}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => openEdit(c)}>
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2" asChild>
                        <a href={`/jobs?customerId=${c.id}`}>
                          View Jobs
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} customers
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Customer #{editingCustomer?.id}</DialogTitle>
            <DialogDescription>
              Update customer master data. Changes are audited.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditCustomer} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="editName">Company / Customer Name *</Label>
              <Input
                id="editName"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="editCode">Customer Code</Label>
                <Input
                  id="editCode"
                  value={editForm.code}
                  onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editStatus">Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="editContact">Contact Person</Label>
                <Input
                  id="editContact"
                  value={editForm.contact}
                  onChange={(e) => setEditForm((f) => ({ ...f, contact: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="editCredit">Credit Terms</Label>
                <Select value={editForm.creditTerms} onValueChange={(v) => setEditForm((f) => ({ ...f, creditTerms: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Immediate">Immediate / Cash</SelectItem>
                    <SelectItem value="30 Days">30 Days</SelectItem>
                    <SelectItem value="60 Days">60 Days</SelectItem>
                    <SelectItem value="90 Days">90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="editAddress">Address</Label>
                <Input
                  id="editAddress"
                  value={editForm.address}
                  onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
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
    </div>
  );
}
