"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DollarSign, Receipt, CreditCard, ArrowUpRight, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function AccountsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
                      <TableHead className="text-right">Action</TableHead>
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
                        <TableCell className="text-right">
                          <Link href={`/jobs/${p.job?.id}`}>
                            <Button size="sm" variant="ghost">View Job</Button>
                          </Link>
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
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Commercial tax invoices and payment references</CardDescription>
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
                      <TableHead>Job Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Issued Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono font-bold text-primary">
                          {inv.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          <Link href={`/jobs/${inv.payment?.job?.id}`} className="hover:underline">
                            {inv.payment?.job?.jobNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{inv.payment?.job?.customer?.contact || "—"}</TableCell>
                        <TableCell className="font-mono">
                          AED {inv.payment?.amount?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(inv.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/jobs/${inv.payment?.job?.id}`}>
                            <Button size="sm" variant="outline">View Job</Button>
                          </Link>
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
    </div>
  );
}
