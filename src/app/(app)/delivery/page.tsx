"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Truck, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function DeliveryPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/delivery")
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

  const deliveries = data?.deliveries || [];
  const stats = data?.stats || { total: 0, pendingCount: 0, dispatchedCount: 0, deliveredCount: 0 };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificate Delivery & Dispatch"
        description="Monitor physical and digital delivery logs of issued certificates to clients"
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Dispatches registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Dispatch</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-amber-600">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for courier/handover</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-blue-600">{stats.dispatchedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">En route to customer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered & Signed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600">{stats.deliveredCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully confirmed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Logs</CardTitle>
          <CardDescription>Real-time delivery fulfillment by courier, mail, or hand handover</CardDescription>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No delivery logs recorded yet. Deliveries can be dispatched from the Job Detail & Certificate screens.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delivery ID</TableHead>
                  <TableHead>Certificate #</TableHead>
                  <TableHead>Job Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono font-medium">#DLV-{d.id}</TableCell>
                    <TableCell className="font-mono font-semibold text-primary">
                      {d.certificate?.number || `#CERT-${d.certificateId}`}
                    </TableCell>
                    <TableCell>
                      {d.certificate?.job ? (
                        <Link href={`/jobs/${d.certificate.job.id}`} className="hover:underline font-medium">
                          {d.certificate.job.jobNumber}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{d.certificate?.job?.customer?.contact || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{d.method || "COURIER"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={d.status === "DELIVERED" ? "default" : "secondary"}
                        className={
                          d.status === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-blue-100 text-blue-800 border-blue-200"
                        }
                      >
                        {d.status || "DISPATCHED"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.deliveryDate ? format(new Date(d.deliveryDate), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {d.certificate?.job && (
                        <Link href={`/jobs/${d.certificate.job.id}`}>
                          <Button size="sm" variant="ghost">View Job</Button>
                        </Link>
                      )}
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
