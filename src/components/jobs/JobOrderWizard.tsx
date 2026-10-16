"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Loader2, Users, ClipboardList, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NewCustomer {
  id: number;
  companyId: number;
  name: string | null;
  code: string | null;
  contact: string | null;
  email: string | null;
  phone: string | null;
}

export interface WizardLocation {
  id: number;
  code: string;
  name: string;
  emirate: string | null;
  locationAccreditations: Array<{
    accreditation: { id: number; code: string; name: string };
    status: string;
    effectiveFrom: string | null;
    effectiveTo: string | null;
  }>;
}

export interface CourseRef {
  id: number;
  title: string;
  code: string | null;
  courseType: string | null;
  certificateValidityMonths: number | null;
}

export interface TraineeRef {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  employeeId: string | null;
}

export interface UserRef {
  id: number;
  name: string;
  email: string;
  role: string;
}

export type ServiceType = "TRAINING" | "INSPECTION";

export interface ServiceLine {
  id: string;
  serviceType: ServiceType;
  courseId?: number;
  trainerId?: number;
  traineeIds?: number[];
  inspectionType?: string;
  equipmentAsset?: string;
  inspectorId?: number;
  requestedDate?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  description?: string;
}

export interface WizardData {
  customerId: number;
  locationId: number;
  internalCustomerId?: number;
  customerReference?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  quotationId?: string;
  priority?: string;
  site?: string;
  scheduledDate?: string;
  engineerId?: number;
  inspectorId?: number;
  scope?: string;
  internalRemarks?: string;
  attachments?: string[];
  services: ServiceLine[];
}

interface WizardProps {
  companyId?: number;
  onClose?: () => void;
}

const STEPS = ["Customer", "Location", "Services", "Scope & Commercial", "Review & Save"] as const;

export function JobOrderWizard({ companyId: propCompanyId, onClose }: WizardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [companyId] = useState(propCompanyId ?? session?.user?.companyId);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    customerId: 0,
    locationId: 0,
    priority: "NORMAL",
    services: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<NewCustomer[]>([]);
  const [locations, setLocations] = useState<WizardLocation[]>([]);
  const [courses, setCourses] = useState<CourseRef[]>([]);
  const [trainees, setTrainees] = useState<TraineeRef[]>([]);
  const [trainers, setTrainers] = useState<UserRef[]>([]);
  const [inspectors, setInspectors] = useState<UserRef[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSearchInput, setCustomerSearchInput] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", contact: "", email: "", phone: "", code: "" });
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [lRes, coRes, trRes, uRes] = await Promise.all([
          fetch(`/api/locations`).then((r) => (r.ok ? r.json() : [])),
          fetch(`/api/training/courses?status=ACTIVE`).then((r) => (r.ok ? r.json() : [])),
          fetch(`/api/trainees`).then((r) => (r.ok ? r.json() : [])),
          fetch(`/api/users`).then((r) => (r.ok ? r.json() : [])),
        ]);
        setLocations(Array.isArray(lRes) ? lRes : []);
        setCourses(Array.isArray(coRes) ? coRes : coRes.courses ?? coRes);
        const trData = Array.isArray(trRes) ? trRes : trRes.trainees ?? [];
        setTrainees(trData);
        const uData = Array.isArray(uRes) ? uRes : uRes.users ?? [];
        const isTrainer = (u: UserRef) => ["TRAINER", "ADMIN", "TRAINING_MANAGER", "ASSESSOR"].includes(u.role?.toUpperCase());
        const isInspector = (u: UserRef) => ["INSPECTOR", "ADMIN", "ENGINEER", "REVIEWER"].includes(u.role?.toUpperCase());
        setTrainers(uData.filter(isTrainer));
        setInspectors(uData.filter(isInspector));
      } catch {
        // tolerate partial failures
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [companyId]);

  // Searchable customer directory (debounced) — stores real DB ids, never names
  useEffect(() => {
    const timer = setTimeout(async () => {
      setCustomerSearch(customerSearchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearchInput]);

  useEffect(() => {
    let cancelled = false;
    const loadCustomers = async () => {
      try {
        const params = new URLSearchParams({ limit: "50" });
        if (customerSearch) params.append("search", customerSearch);
        const res = await fetch(`/api/customers?${params.toString()}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) {
          setCustomers(Array.isArray(json) ? json : json.customers ?? []);
        }
      } catch {
        // tolerate
      }
    };
    loadCustomers();
    return () => {
      cancelled = true;
    };
  }, [customerSearch]);

  const handleCreateCustomerInline = async () => {
    if (!newCustomer.name && !newCustomer.contact) {
      setCustomerError("Customer name or contact is required.");
      return;
    }
    setCreatingCustomer(true);
    setCustomerError(null);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustomer.name,
          contact: newCustomer.contact,
          email: newCustomer.email,
          phone: newCustomer.phone,
          code: newCustomer.code,
          siteName: newCustomer.name ? `${newCustomer.name} Main Facility` : undefined,
        }),
      });
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setCustomerError(data.error || "A customer with these details already exists. Select the existing record instead.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create customer");
      }
      const data = await res.json();
      const created = data.customer;
      // Refresh the list and select the newly created customer by its real DB id
      setCustomerSearch("");
      setCustomerSearchInput("");
      const listRes = await fetch(`/api/customers?limit=50`);
      if (listRes.ok) {
        const listJson = await listRes.json();
        setCustomers(Array.isArray(listJson) ? listJson : listJson.customers ?? []);
      }
      updateData({ customerId: created.id });
      setShowNewCustomer(false);
      setNewCustomer({ name: "", contact: "", email: "", phone: "", code: "" });
    } catch (err) {
      setCustomerError(err instanceof Error ? err.message : "Failed to create customer");
    } finally {
      setCreatingCustomer(false);
    }
  };

  const updateData = (patch: Partial<WizardData>) => setData((p) => ({ ...p, ...patch }));

  const handleServiceToggle = (type: ServiceType) => {
    const exists = data.services.some((s) => s.serviceType === type);
    if (exists) {
      updateData({ services: data.services.filter((s) => s.serviceType !== type) });
    } else {
      updateData({
        services: [
          ...data.services.filter((s) => s.serviceType !== type),
          { id: `${type}-${Date.now()}`, serviceType: type },
        ],
      });
    }
  };

  const updateService = (id: string, patch: Partial<ServiceLine>) => {
    updateData({
      services: data.services.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  const removeService = (id: string) => {
    updateData({ services: data.services.filter((s) => s.id !== id) });
  };

  const canProceed = () => {
    if (step === 0) return data.customerId > 0;
    if (step === 1) return data.locationId > 0;
    if (step === 2) return data.services.length > 0;
    if (step === 3) return true;
    return true;
  };

  const handleSubmit = async () => {
    if (data.services.length === 0) {
      setError("Select at least one service (Training or Inspection).");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const services = data.services.map((s) => ({
        serviceType: s.serviceType,
        serviceCode: s.inspectionType,
        description: s.description,
        requestedDate: s.requestedDate ? new Date(s.requestedDate) : undefined,
        scheduledStart: s.scheduledStart ? new Date(s.scheduledStart) : undefined,
        scheduledEnd: s.scheduledEnd ? new Date(s.scheduledEnd) : undefined,
        assignedResponsibleId: (s.serviceType === "TRAINING" ? s.trainerId : s.inspectorId) || undefined,
        ...(s.serviceType === "TRAINING"
          ? {
              courseId: s.courseId,
              trainerId: s.trainerId,
              traineeIds: s.traineeIds,
            }
          : {
              inspectionType: s.inspectionType,
              equipmentAsset: s.equipmentAsset,
              inspectorId: s.inspectorId,
            }),
      }));

      const res = await fetch(`/api/jobs?companyId=${companyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          customerId: data.customerId,
          locationId: data.locationId,
          customerReference: data.customerReference || undefined,
          contactName: data.contactName || undefined,
          contactPhone: data.contactPhone || undefined,
          contactEmail: data.contactEmail || undefined,
          quotationId: data.quotationId || undefined,
          priority: data.priority || undefined,
          site: data.site || undefined,
          scheduledDate: data.scheduledDate || undefined,
          engineerId: data.engineerId || undefined,
          inspectorId: data.inspectorId || undefined,
          scope: data.scope || undefined,
          internalRemarks: data.internalRemarks || undefined,
          notes: data.internalRemarks || undefined,
          services,
        }),
      });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed to create job order");
      }

      const created = await res.json();
      setIsSubmitting(false);
      onClose?.();
      router.push(`/jobs/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job order");
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <Label>Customer *</Label>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by company name, code, contact, or email..."
                  value={customerSearchInput}
                  onChange={(e) => setCustomerSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={String(data.customerId || "")}
                onValueChange={(v) => updateData({ customerId: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select existing customer (stores database ID)" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name || c.contact || c.email}
                      {c.code ? ` (${c.code})` : ""} — ID #{c.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {data.customerId > 0 && (
              <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p>
                  Selected customer ID <span className="font-mono font-semibold">#{data.customerId}</span>.
                  The job order will reference this database record — never a free-text name.
                </p>
              </div>
            )}

            {showNewCustomer ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Register New Customer</CardTitle>
                  <CardDescription>
                    Create a customer record inline. Duplicate names, codes, emails and TRN numbers are rejected.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {customerError && <AlertBanner variant="error" title="Cannot create customer" description={customerError} />}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Company / Customer Name *</Label>
                      <Input
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer((n) => ({ ...n, name: e.target.value }))}
                        placeholder="e.g. Al Habtoor Grand Resort LLC"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Customer Code</Label>
                      <Input
                        value={newCustomer.code}
                        onChange={(e) => setNewCustomer((n) => ({ ...n, code: e.target.value }))}
                        placeholder="e.g. CUST-HBT-01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Person</Label>
                      <Input
                        value={newCustomer.contact}
                        onChange={(e) => setNewCustomer((n) => ({ ...n, contact: e.target.value }))}
                        placeholder="e.g. Eng. Tariq"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer((n) => ({ ...n, email: e.target.value }))}
                        placeholder="operations@client.com"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Phone</Label>
                      <Input
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer((n) => ({ ...n, phone: e.target.value }))}
                        placeholder="+971 50 123 4567"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowNewCustomer(false)}>
                      Cancel
                    </Button>
                    <Button type="button" size="sm" onClick={handleCreateCustomerInline} disabled={creatingCustomer}>
                      {creatingCustomer ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      Create & Select
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={() => setShowNewCustomer(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Register new customer
              </Button>
            )}

            <p className="text-xs text-muted-foreground">
              Search the directory first. Only register a new customer when no matching record exists — this prevents duplicate customer records.
            </p>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <Label>Job Location *</Label>
            <Select
              value={String(data.locationId || "")}
              onValueChange={(v) => updateData({ locationId: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => {
                  const accred = l.locationAccreditations[0]?.accreditation.code;
                  const approved = l.locationAccreditations[0]?.status === "VERIFIED";
                  return (
                    <SelectItem key={l.id} value={String(l.id)} disabled={!approved}>
                      {l.name} ({l.emirate}) — {accred ?? "No accreditation"}
                      {!approved && " (pending approval)"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              Accreditation is resolved from location master data (Dubai → EIAC, Abu Dhabi → ENAS).
              Incompatible or unverified combinations are rejected server-side.
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <fieldset className="space-y-2">
              <Legend>Select Service Types</Legend>
              <div className="flex gap-4">
                <ServiceToggle
                  selected={data.services.some((s) => s.serviceType === "TRAINING")}
                  onClick={() => handleServiceToggle("TRAINING")}
                  icon={<GraduationCapIcon />}
                  label="Training Certification"
                />
                <ServiceToggle
                  selected={data.services.some((s) => s.serviceType === "INSPECTION")}
                  onClick={() => handleServiceToggle("INSPECTION")}
                  icon={<ClipboardList fontSize={20} />}
                  label="Inspection Certification"
                />
              </div>
            </fieldset>

            {data.services.filter((s) => s.serviceType === "TRAINING").map((s) => (
              <TrainingServiceForm
                key={s.id}
                service={s}
                courses={courses}
                trainers={trainers}
                trainees={trainees}
                updateService={updateService}
                onRemove={() => removeService(s.id)}
              />
            ))}

            {data.services.filter((s) => s.serviceType === "INSPECTION").map((s) => (
              <InspectionServiceForm
                key={s.id}
                service={s}
                inspectors={inspectors}
                updateService={updateService}
                onRemove={() => removeService(s.id)}
              />
            ))}

            {data.services.length === 0 && (
              <p className="text-sm text-muted-foreground">Choose at least one service above.</p>
            )}
          </div>
        );
      case 3:
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Quotation Reference</Label>
              <Input
                value={data.quotationId || ""}
                onChange={(e) => updateData({ quotationId: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>Customer Reference</Label>
              <Input
                value={data.customerReference || ""}
                onChange={(e) => updateData({ customerReference: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={data.priority || "NORMAL"} onValueChange={(v) => updateData({ priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Requested Date</Label>
              <Input
                type="date"
                value={data.scheduledDate || ""}
                onChange={(e) => updateData({ scheduledDate: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Job Description (Scope)</Label>
              <Textarea
                value={data.scope || ""}
                onChange={(e) => updateData({ scope: e.target.value || undefined })}
                placeholder="Describe the work / service scope..."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Customer Remarks</Label>
              <Input
                value={data.contactName || ""}
                onChange={(e) => updateData({ contactName: e.target.value || undefined })}
                placeholder="Contact name"
              />
            </div>
            <div className="space-y-2">
              <Label>Internal Remarks</Label>
              <Textarea
                value={data.internalRemarks || ""}
                onChange={(e) => updateData({ internalRemarks: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>Site Location (free text)</Label>
              <Input
                value={data.site || ""}
                onChange={(e) => updateData({ site: e.target.value || undefined })}
              />
            </div>
          </div>
        );
      case 4:
        return renderReview();
    }
  };

  function renderReview() {
    const customer = customers.find((c) => c.id === data.customerId);
    const location = locations.find((l) => l.id === data.locationId);
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{customer?.contact || customer?.email || "—"}</p>
            <p className="text-sm text-muted-foreground">{customer?.email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              {location?.name} ({location?.emirate}) — {location?.locationAccreditations[0]?.accreditation.code}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>{data.services.length} service line(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.services.map((s) => (
              <div key={s.id} className="flex items-center justify-between border p-2 rounded">
                <div>
                  <span className="font-medium">
                    {s.serviceType === "TRAINING" ? "Training" : "Inspection"}
                  </span>
                  {s.description ? <span className="text-sm text-muted-foreground"> — {s.description}</span> : null}
                </div>
                {s.serviceType === "TRAINING" && s.courseId && (
                  <span className="text-sm">Course: {courses.find((c) => c.id === s.courseId)?.title}</span>
                )}
                {s.serviceType === "INSPECTION" && s.inspectionType && (
                  <span className="text-sm">Type: {s.inspectionType}</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Commercial</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1 text-sm">
            <p>Quotation: {data.quotationId || "—"}</p>
            <p>Priority: {data.priority}</p>
            <p>Requested: {data.scheduledDate || "—"}</p>
            <p>Scope: {data.scope || "—"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium",
                i === step
                  ? "bg-indigo-600 text-white"
                  : i < step
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              {i + 1}
            </div>
            <span className="text-sm">{s}</span>
            {i < STEPS.length - 1 && <span className="text-gray-300">→</span>}
          </div>
        ))}
      </div>

      {error && <AlertBanner variant="error" title="Error" description={error} />}

      <Card>
        <CardContent className="pt-6">{loadingData && step <= 1 ? <LoaderWrapper /> : renderStep()}</CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || isSubmitting}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed() || isSubmitting}>
            Continue
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Job Order"}
          </Button>
        )}
      </div>
    </div>
  );
}

function LoaderWrapper() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
    </div>
  );
}

function ServiceToggle({
  selected,
  onClick,
  icon,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 p-4 border rounded-lg text-center cursor-pointer transition",
        selected
          ? "border-indigo-600 bg-indigo-50 text-indigo-900"
          : "border-gray-200 hover:border-gray-300"
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function GraduationCapIcon() {
  return <Users className="h-5 w-5 text-indigo-600" />;
}

function TrainingServiceForm({
  service,
  courses,
  trainers,
  trainees,
  updateService,
  onRemove,
}: {
  service: ServiceLine;
  courses: CourseRef[];
  trainers: UserRef[];
  trainees: TraineeRef[];
  updateService: (id: string, patch: Partial<ServiceLine>) => void;
  onRemove: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Training Service</span>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Course *</Label>
          <Select
            value={String(service.courseId || "")}
            onValueChange={(v) => updateService(service.id, { courseId: Number(v) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.title} {c.code ? `(${c.code})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Trainer</Label>
          <Select
            value={String(service.trainerId || "")}
            onValueChange={(v) => updateService(service.id, { trainerId: Number(v) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Assign trainer" />
            </SelectTrigger>
            <SelectContent>
              {trainers.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.name} ({t.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Trainees (multi-select via checkboxes)</Label>
          <div className="max-h-40 overflow-y-auto border rounded p-2 grid gap-1">
            {trainees.map((t) => {
              const checked = service.traineeIds?.includes(t.id) ?? false;
              return (
                <label key={t.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const ids = service.traineeIds || [];
                      const updated = e.target.checked
                        ? [...ids, t.id]
                        : ids.filter((x) => x !== t.id);
                      updateService(service.id, { traineeIds: updated });
                    }}
                  />
                  <span>{t.firstName} {t.lastName}</span>
                </label>
              );
            })}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Scheduled Start</Label>
          <Input
            type="datetime-local"
            value={service.scheduledStart?.slice(0, 16) || ""}
            onChange={(e) => updateService(service.id, { scheduledStart: e.target.value || undefined })}
          />
        </div>
        <div className="space-y-2">
          <Label>Scheduled End</Label>
          <Input
            type="datetime-local"
            value={service.scheduledEnd?.slice(0, 16) || ""}
            onChange={(e) => updateService(service.id, { scheduledEnd: e.target.value || undefined })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function InspectionServiceForm({
  service,
  inspectors,
  updateService,
  onRemove,
}: {
  service: ServiceLine;
  inspectors: UserRef[];
  updateService: (id: string, patch: Partial<ServiceLine>) => void;
  onRemove: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Inspection Service</span>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Inspection Type *</Label>
          <Input
            value={service.inspectionType || ""}
            onChange={(e) => updateService(service.id, { inspectionType: e.target.value || undefined })}
            placeholder="e.g. Lifting Equipment, Electrical"
          />
        </div>
        <div className="space-y-2">
          <Label>Equipment / Asset</Label>
          <Input
            value={service.equipmentAsset || ""}
            onChange={(e) => updateService(service.id, { equipmentAsset: e.target.value || undefined })}
            placeholder="Asset tag / description"
          />
        </div>
        <div className="space-y-2">
          <Label>Engineer / Inspector</Label>
          <Select
            value={String(service.inspectorId || "")}
            onValueChange={(v) => updateService(service.id, { inspectorId: Number(v) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Assign inspector" />
            </SelectTrigger>
            <SelectContent>
              {inspectors.map((i) => (
                <SelectItem key={i.id} value={String(i.id)}>
                  {i.name} ({i.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Scheduled Date</Label>
          <Input
            type="date"
            value={service.requestedDate || service.scheduledStart?.slice(0, 10) || ""}
            onChange={(e) => updateService(service.id, { requestedDate: e.target.value || undefined })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Legend({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium mb-1">{children}</p>;
}