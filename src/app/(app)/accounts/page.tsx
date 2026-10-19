"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DollarSign,
  Receipt,
  CreditCard,
  ArrowUpRight,
  Plus,
  Loader2,
  FileText,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function AccountsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [newPayment, setNewPayment] = useState({ jobId: "", amount: "", method: "BANK_TRANSFER", status: "PENDING" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/payments")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleAddPayment = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: Number(newPayment.jobId),
          amount: parseFloat(newPayment.amount),
          method: newPayment.method,
          status: newPayment.status,
        }),
      });
      if (res.ok) {
        const updated = await fetch("/api/payments").then((r) => r.json());
        setData(updated);
        setShowAddPaymentDialog(false);
        setNewPayment({ jobId: "", amount: "", method: "BANK_TRANSFER", status: "PENDING" });
      } else {
        alert("Failed to add payment");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to add payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const payments = data?.payments || [];
  const invoices = data?.invoices || [];
  const stats = data?.stats || { totalBilled: 0, paidCount: 0, pendingCount: 0, totalInvoices: 0 };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts & Billing"
        description="Track commercial accounts, incoming payments, and generated invoices per job order"
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              AED {stats.totalBilled.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices Issued</CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">Tax invoices generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settled Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats.paidCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Fully paid transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Settlement</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-amber-600">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting client payment</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="w-full">
        <TabsList>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Recorded Payments</CardTitle>
              <CardDescription>Payment status mapped to parent Job Orders</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No payments recorded yet. Payments are initiated directly from Job Orders.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Job Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Amount</TableHead>
                   <TableHead>Status</TableHead>
                     <TableHead>Date</TableHead>
                     <TableHead>Invoice</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {payments.map((p: any) => (
                     <TableRow key={p.id}>
                       <TableCell className="font-mono font-medium">#PAY-{p.id}</TableCell>
                       <TableCell>
                         <Link href={`/jobs/${p.job?.id}`} className="text-primary hover:underline font-medium">
                           {p.job?.jobNumber || `Job #${p.jobId}`}
                         </Link>
                       </TableCell>
                       <TableCell>{p.job?.customer?.contact || "—"}</TableCell>
                       <TableCell>{p.method || "BANK_TRANSFER"}</TableCell>
                       <TableCell className="font-mono font-semibold">
                         AED {p.amount?.toLocaleString()}
                       </TableCell>
                       <TableCell>
                         <Badge
                           variant={p.status === "PAID" || p.status === "completed" ? "default" : "outline"}
                           className={
                             p.status === "PAID" || p.status === "completed"
                               ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                               : "bg-amber-50 text-amber-800 border-amber-200"
                           }
                         >
                           {p.status || "PENDING"}
                         </Badge>
                       </TableCell>
                       <TableCell className="text-xs text-muted-foreground">
                         {format(new Date(p.createdAt), "MMM d, yyyy")}
                       </TableCell>
                       <TableCell className="font-mono text-xs">
                         {p.invoices?.[0]?.invoiceNumber || "—"}
                       </TableCell>
                       <TableCell className="text-right">
                         <div className="flex justify-end gap-2">
                           {p.invoices?.[0]?.id && (
                             <Link href={`/api/payments/invoices/pdf/${p.invoices[0].id}`} passHref>
                               <Button size="sm" variant="outline" asChild>
                                 <a>
                                   <FileText className="h-3 w-3 mr-1" />
                                   PDF
                                 </a>
                               </Button>
                             </Link>
                           )}
                           {p.invoices?.[0]?.id && (
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={async () => {
                                 if (confirm("Create delivery note for this invoice?")) {
                                   const res = await fetch("/api/certificates/delivery-notes", {
                                     method: "POST",
                                     headers: { "Content-Type": "application/json" },
                                     body: JSON.stringify({
                                       certificateId: p.job?.certificates?.[0]?.id || 0,
                                       title: `Delivery Note for Invoice ${p.invoices[0].invoiceNumber}`,
                                       deliveryMethod: "courier",
                                     }),
                                   });
                                   if (res.ok) alert("Delivery note created");
                                   else alert("Failed to create delivery note");
                                 }
                               }}
                             >
                               <Receipt className="h-3 w-3 mr-1" />
                               DN
                             </Button>
                           )}
                           <Link href={`/jobs/${p.job?.id}`}>
                             <Button size="sm" variant="ghost">
                               <ExternalLink className="h-3 w-3" />
                             </Button>
                           </Link>
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <Button size="sm" variant="default" className="flex items-center gap-2" onClick={() => setShowAddPaymentDialog(true)}>
              <Plus className="h-4 w-4" />
              Add Payment
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Commercial tax invoices with payment references and certification details</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No invoices generated yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Company ID</TableHead>
                      <TableHead>Job Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Certificate</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Print Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono font-bold text-primary">
                          {inv.invoiceNumber}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {inv.companyId || "—"}
                        </TableCell>
                        <TableCell>
                          <Link href={`/jobs/${inv.payment?.job?.id}`} className="hover:underline">
                            {inv.payment?.job?.jobNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{inv.payment?.job?.customer?.contact || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {inv.payment?.job?.certificates?.[0]?.number || "—"}
                        </TableCell>
                        <TableCell className="font-mono">
                          AED {inv.payment?.amount?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={inv.payment?.status === "PAID" || inv.payment?.status === "completed" ? "default" : "outline"}
                            className={
                              inv.payment?.status === "PAID" || inv.payment?.status === "completed"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }
                          >
                            {inv.payment?.status || "PENDING"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(inv.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {inv.deliveryLogs?.length > 0 ? (
                            <Badge variant="default" className="bg-blue-500/15 text-blue-500 border-blue-500/20 text-xs">
                              Printed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Not Printed</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/api/payments/invoices/pdf/${inv.id}`} passHref>
                              <Button size="sm" variant="outline" asChild>
                                <a>
                                  <FileText className="h-3 w-3 mr-1" />
                                  Print PDF
                                </a>
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (confirm(`Create delivery note for invoice ${inv.invoiceNumber}?`)) {
                                  const res = await fetch("/api/certificates/delivery-notes", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      certificateId: inv.payment?.job?.certificates?.[0]?.id || 0,
                                      title: `Delivery Note for Invoice ${inv.invoiceNumber}`,
                                      deliveryMethod: "courier",
                                    }),
                                  });
                                  if (res.ok) alert("Delivery note created");
                                  else alert("Failed to create delivery note");
                                }
                              }}
                            >
                              <Receipt className="h-3 w-3 mr-1" />
                              Delivery Note
                            </Button>
                            <Link href={`/jobs/${inv.payment?.job?.id}`}>
                              <Button size="sm" variant="ghost">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Payment Dialog */}
      <Dialog open={showAddPaymentDialog} onOpenChange={setShowAddPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record New Payment</DialogTitle>
            <DialogDescription>Add a new payment for an existing job order.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="jobId">Job ID</Label>
              <Input
                id="jobId"
                type="number"
                placeholder="Enter job ID"
                value={newPayment.jobId}
                onChange={(e) => setNewPayment({ ...newPayment, jobId: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (AED)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select value={newPayment.method} onValueChange={(v) => setNewPayment({ ...newPayment, method: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Payment Status</Label>
              <Select value={newPayment.status} onValueChange={(v) => setNewPayment({ ...newPayment, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPayment} disabled={submitting}>
              {submitting ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
