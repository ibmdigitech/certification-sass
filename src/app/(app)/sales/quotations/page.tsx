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
import { Plus, Search, FileSignature, ArrowRight, Loader2, CheckCircle2, Briefcase, ExternalLink, FileText, Download } from "lucide-react";

interface QuotationRecord {
  id: number;
  quotationNumber: string;
  revisionNumber: number;
  title: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  customer: { id: number; name: string | null; contact: string | null };
  salesPerson: { id: number; name: string } | null;
  items: { id: number; serviceType: string; description: string; quantity: number; unitPrice: number; totalPrice: number }[];
  convertedJob: { id: number; jobNumber: string; status: string } | null;
}

export default function SalesQuotationsPage() {
  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const [printingId, setPrintingId] = useState<number | null>(null);

  // Form states
  const [customerId, setCustomerId] = useState("");
  const [title, setTitle] = useState("");
  const [serviceType, setServiceType] = useState("INSPECTION");
  const [itemDesc, setItemDesc] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemRate, setItemRate] = useState("1200");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qtRes, custRes] = await Promise.all([
        fetch("/api/sales/quotations"),
        fetch("/api/customers"),
      ]);

      if (qtRes.ok) {
        const json = await qtRes.json();
        setQuotations(json.quotations || []);
      }
      if (custRes.ok) {
        const json = await custRes.json();
        setCustomers(json.customers || []);
      }
    } catch (err) {
      console.error("Failed to load quotations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !title || !itemDesc) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/sales/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          title,
          items: [
            {
              serviceType,
              description: itemDesc,
              quantity: Number(itemQty),
              unitPrice: Number(itemRate),
            },
          ],
        }),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        setTitle("");
        setItemDesc("");
        fetchData();
      }
    } catch (err) {
      console.error("Failed to create quotation:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvertToJob = async (quotationId: number) => {
    try {
      setConvertingId(quotationId);
      const res = await fetch("/api/sales/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "convert_to_job",
          quotationId,
        }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Error converting quotation:", err);
    } finally {
      setConvertingId(null);
    }
  };

  const handlePrintPDF = async (quotationId: number, quotationNumber: string) => {
    setPrintingId(quotationId);
    try {
      const res = await fetch(`/api/sales/quotations/${quotationId}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${quotationNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Error printing quotation:", err);
    } finally {
      setPrintingId(null);
    }
  };

  const filtered = quotations.filter(
    (q) =>
      q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      (q.customer?.name && q.customer.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Quotations</h1>
          <p className="text-sm text-muted-foreground">
            Commercial service proposals, multi-service pricing, and Job Order conversion
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              New Quotation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Formulate Commercial Quotation</DialogTitle>
              <DialogDescription>
                Create a detailed pricing offer with inspection / training line items.
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
                <Label htmlFor="title">Proposal Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Annual Lifting Equipment Examination & Certification"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="p-3 border rounded-lg bg-muted/20 space-y-3">
                <div className="font-semibold text-xs text-primary">Initial Line Item</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="srvType">Service Discipline</Label>
                    <Select value={serviceType} onValueChange={setServiceType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Service Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INSPECTION">Thorough Inspection</SelectItem>
                        <SelectItem value="TRAINING">Operator Training</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="qty">Quantity</Label>
                    <Input
                      id="qty"
                      type="number"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="desc">Item Description *</Label>
                  <Input
                    id="desc"
                    placeholder="e.g. Tower Crane 6-Monthly Thorough Examination (EIAC Scope)"
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="rate">Unit Rate (AED) *</Label>
                  <Input
                    id="rate"
                    type="number"
                    value={itemRate}
                    onChange={(e) => setItemRate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Quotation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search quotations by number, title, or client..."
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
                <TableHead className="font-bold text-xs">Quotation #</TableHead>
                <TableHead className="font-bold text-xs">Customer</TableHead>
                <TableHead className="font-bold text-xs min-w-[220px]">Title & Scope</TableHead>
                <TableHead className="font-bold text-xs text-right">Subtotal</TableHead>
                <TableHead className="font-bold text-xs text-right">VAT (5%)</TableHead>
                <TableHead className="font-bold text-xs text-right">Total (AED)</TableHead>
                <TableHead className="font-bold text-xs text-center">Status</TableHead>
                <TableHead className="font-bold text-xs text-right">Conversion Action</TableHead>
                <TableHead className="font-bold text-xs text-center">Print</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-xs text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-xs text-muted-foreground">
                    No commercial quotations formulated yet.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((q) => {
                  const isConverted = q.status === "CONVERTED" || Boolean(q.convertedJob);
                  return (
                    <TableRow key={q.id} className="text-xs hover:bg-muted/20">
                      <TableCell className="font-mono font-semibold text-primary">
                        {q.quotationNumber}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {q.customer?.name || q.customer?.contact}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{q.title}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {q.items.length} line item{q.items.length !== 1 ? "s" : ""}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {q.subtotal.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {q.taxAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-foreground">
                        {q.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={isConverted ? "default" : "secondary"}
                          className={`text-[10px] ${
                            isConverted ? "bg-emerald-600 text-white" : "bg-blue-500/10 text-blue-600"
                          }`}
                        >
                          {q.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isConverted && q.convertedJob ? (
                          <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                            <Link href={`/jobs/${q.convertedJob.id}`}>
                              <Briefcase className="h-3.5 w-3.5 mr-1 text-primary" />
                              Job #{q.convertedJob.jobNumber}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                            disabled={convertingId === q.id}
                            onClick={() => handleConvertToJob(q.id)}
                          >
                            {convertingId === q.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                            ) : (
                              <Briefcase className="h-3.5 w-3.5 mr-1" />
                            )}
                            Convert to Job
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={printingId === q.id}
                          onClick={() => handlePrintPDF(q.id, q.quotationNumber)}
                          title="Print Quotation PDF"
                        >
                          {printingId === q.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
