"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Plus, Search, FileText, UserCheck, ArrowRight, Loader2, Calendar } from "lucide-react";

interface InquiryRecord {
  id: number;
  inquiryNumber: string;
  subject: string;
  scope: string | null;
  source: string | null;
  status: string;
  receivedDate: string;
  customer: { id: number; name: string | null; contact: string | null };
  salesPerson: { id: number; name: string } | null;
  _count?: { quotations: number };
}

export default function SalesInquiriesPage() {
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [customerId, setCustomerId] = useState("");
  const [salesPersonId, setSalesPersonId] = useState("");
  const [subject, setSubject] = useState("");
  const [scope, setScope] = useState("");
  const [source, setSource] = useState("Direct");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [inqRes, custRes, userRes] = await Promise.all([
        fetch("/api/sales/inquiries"),
        fetch("/api/customers"),
        fetch("/api/users"),
      ]);

      if (inqRes.ok) {
        const json = await inqRes.json();
        setInquiries(json.inquiries || []);
      }
      if (custRes.ok) {
        const json = await custRes.json();
        setCustomers(json.customers || []);
      }
      if (userRes.ok) {
        const json = await userRes.json();
        setSalesPersons(json.users || []);
      }
    } catch (err) {
      console.error("Failed to load inquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !subject) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/sales/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          salesPersonId,
          subject,
          scope,
          source,
        }),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        setCustomerId("");
        setSubject("");
        setScope("");
        fetchData();
      }
    } catch (err) {
      console.error("Failed to create inquiry:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = inquiries.filter(
    (i) =>
      i.inquiryNumber.toLowerCase().includes(search.toLowerCase()) ||
      i.subject.toLowerCase().includes(search.toLowerCase()) ||
      (i.customer?.name && i.customer.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Inquiries</h1>
          <p className="text-sm text-muted-foreground">
            Commercial inspection inquiries, tender leads, and quotation requests
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              New Inquiry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Register Sales Inquiry</DialogTitle>
              <DialogDescription>
                Record incoming request from customer for inspection or training services.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="cust">Customer Account *</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name || c.contact} ({c.code || `#${c.id}`})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="sp">Assigned Salesperson</Label>
                <Select value={salesPersonId} onValueChange={setSalesPersonId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sales person" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {salesPersons.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="subj">Inquiry Subject *</Label>
                <Input
                  id="subj"
                  placeholder="e.g. Annual Crane & Lifting Gear Thorough Examination"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="scp">Scope / Asset Details</Label>
                <Input
                  id="scp"
                  placeholder="e.g. 2 Overhead Cranes + 4 MEWPs at Al Quoz yard"
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="src">Inquiry Source</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Direct">Direct Client Call</SelectItem>
                    <SelectItem value="Email">Email Request</SelectItem>
                    <SelectItem value="Tender">Government / Corporate Tender</SelectItem>
                    <SelectItem value="Website">Portal Submission</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Inquiry
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search inquiries by number, subject, or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-bold text-xs">Inquiry #</TableHead>
                <TableHead className="font-bold text-xs">Customer</TableHead>
                <TableHead className="font-bold text-xs min-w-[240px]">Subject & Scope</TableHead>
                <TableHead className="font-bold text-xs">Salesperson</TableHead>
                <TableHead className="font-bold text-xs">Source</TableHead>
                <TableHead className="font-bold text-xs text-center">Status</TableHead>
                <TableHead className="font-bold text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                    No sales inquiries registered yet.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((inq) => (
                  <TableRow key={inq.id} className="text-xs hover:bg-muted/20">
                    <TableCell className="font-mono font-semibold text-primary">
                      {inq.inquiryNumber}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {inq.customer?.name || inq.customer?.contact}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">{inq.subject}</div>
                      {inq.scope && <div className="text-[11px] text-muted-foreground">{inq.scope}</div>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {inq.salesPerson?.name || "Unassigned"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {inq.source || "Direct"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 text-[10px]">
                        {inq.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                        <Link href={`/sales/quotations?inquiryId=${inq.id}&customerId=${inq.customer?.id}`}>
                          Formulate Quote
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
