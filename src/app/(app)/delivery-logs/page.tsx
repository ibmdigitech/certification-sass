"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck, CheckCircle2, Clock, AlertCircle, Loader2, Search, Download, FileText, ExternalLink, QrCode } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface DeliveryLog {
  id: number;
  certificateNumber: string | null;
  certificateType: string | null;
  holderName: string | null;
  holderCompany: string | null;
  course: string | null;
  courseCode: string | null;
  inspectionDate: string | null;
  jobNumber: string | null;
  customerName: string | null;
  customerNumber: string | null;
  salesPerson: string | null;
  salesPersonEmail: string | null;
  inspector: string | null;
  location: string | null;
  locationCode: string | null;
  paymentMethod: string | null;
  paymentAmount: number | null;
  paymentStatus: string | null;
  printedBy: string | null;
  printedByEmail: string | null;
  deliveryDate: string | null;
  method: string | null;
  status: string | null;
  notes: string | null;
  createdAt: string;
}

interface DeliveryLogsResponse {
  logs: DeliveryLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function DeliveryLogsPage() {
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  const fetchLogs = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "20");
      if (searchQuery) params.append("holderName", searchQuery);
      if (statusFilter) params.append("status", statusFilter);
      if (methodFilter && methodFilter !== "ALL") params.append("method", methodFilter);

      const res = await fetch(`/api/certificates/delivery-logs?${params}`);
      if (res.ok) {
        const data: DeliveryLogsResponse = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setCurrentPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch delivery logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [searchQuery, statusFilter, methodFilter]);

  const getStatusBadgeVariant = (status: string | null): "default" | "secondary" | "destructive" | "outline" => {
    if (!status) return "secondary";
    const s = status.toUpperCase();
    if (s === "DELIVERED") return "default";
    if (s === "PENDING") return "destructive";
    if (s === "IN_TRANSIT" || s === "DISPATCHED") return "secondary";
    return "outline";
  };

  const getStatusBadgeClass = (status: string | null): string => {
    if (!status) return "bg-slate-500/15 text-slate-500";
    const s = status.toUpperCase();
    if (s === "DELIVERED") return "bg-emerald-500/15 text-emerald-500 border-emerald-200";
    if (s === "PENDING") return "bg-amber-500/15 text-amber-500 border-amber-200";
    if (s === "IN_TRANSIT" || s === "DISPATCHED") return "bg-blue-500/15 text-blue-500 border-blue-200";
    return "bg-slate-500/15 text-slate-500";
  };

  const getPaymentBadgeVariant = (method: string | null): "default" | "secondary" | "destructive" | "outline" => {
    if (!method) return "outline";
    const m = method.toUpperCase();
    if (m === "CASH" || m === "CARD") return "default";
    if (m === "TRANSFER" || m === "BANK_TRANSFER") return "secondary";
    if (m === "PENDING") return "destructive";
    return "outline";
  };

  const getPaymentBadgeClass = (method: string | null, status: string | null): string => {
    if (!method) return "bg-slate-500/15 text-slate-500";
    const m = method.toUpperCase();
    if (m === "CASH") return "bg-green-500/15 text-green-500";
    if (m === "CARD") return "bg-purple-500/15 text-purple-500";
    if (m === "TRANSFER" || m === "BANK_TRANSFER") return "bg-indigo-500/15 text-indigo-500";
    return "bg-slate-500/15 text-slate-500";
  };

  const getMethodBadgeVariant = (method: string | null): "default" | "secondary" | "outline" => {
    if (!method) return "outline";
    const m = method.toUpperCase();
    if (m === "COURIER") return "default";
    if (m === "HAND_DELIVERY" || m === "HANDOVER") return "secondary";
    if (m === "MAIL" || m === "POST") return "outline";
    if (m === "DIGITAL") return "secondary";
    return "outline";
  };

  const getMethodBadgeClass = (method: string | null): string => {
    if (!method) return "bg-slate-500/15 text-slate-500";
    const m = method.toUpperCase();
    if (m === "COURIER") return "bg-blue-500/15 text-blue-500";
    if (m === "HAND_DELIVERY" || m === "HANDOVER") return "bg-emerald-500/15 text-emerald-500";
    if (m === "MAIL" || m === "POST") return "bg-amber-500/15 text-amber-500";
    if (m === "DIGITAL") return "bg-indigo-500/15 text-indigo-500";
    return "bg-slate-500/15 text-slate-500";
  };

  const getStatusIcon = (status: string | null) => {
    if (!status) return <Clock className="h-4 w-4 text-amber-600" />;
    const s = status.toUpperCase();
    if (s === "DELIVERED") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    if (s === "PENDING") return <AlertCircle className="h-4 w-4 text-amber-600" />;
    if (s === "IN_TRANSIT" || s === "DISPATCHED") return <Truck className="h-4 w-4 text-blue-600" />;
    return <Clock className="h-4 w-4 text-slate-600" />;
  };

  const getStatusText = (status: string | null): string => {
    if (!status) return "Unknown";
    const s = status.toUpperCase();
    if (s === "DELIVERED") return "Delivered";
    if (s === "PENDING") return "Pending";
    if (s === "IN_TRANSIT") return "In Transit";
    if (s === "DISPATCHED") return "Dispatched";
    if (s === "RETURNED") return "Returned";
    if (s === "FAILED") return "Failed";
    return status;
  };

  const getMethodText = (method: string | null): string => {
    if (!method) return "Courier";
    const m = method.toUpperCase();
    if (m === "HAND_DELIVERY" || m === "HANDOVER") return "Hand Delivery";
    if (m === "MAIL" || m === "POST") return "Mail";
    if (m === "DIGITAL") return "Digital";
    if (m === "COURIER") return "Courier";
    return method;
  };

  const downloadPDF = async (log: DeliveryLog) => {
    const response = await fetch(`/api/certificates?number=${log.certificateNumber}`);
    if (response.ok) {
      const data = await response.json();
      const cert = data.certificates?.[0] || data[0];
      if (cert?.pdfUrl) {
        const pdfRes = await fetch(cert.pdfUrl);
        if (pdfRes.ok) {
          const blob = await pdfRes.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${log.certificateNumber}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }
    }
  };

  const openVerification = (log: DeliveryLog) => {
    if (log.certificateNumber) {
      const url = `/verify/${log.certificateNumber}`;
      window.open(url, "_blank");
    }
  };

  const stats = {
    total: total,
    delivered: logs.filter(l => (l.status || "").toUpperCase() === "DELIVERED").length,
    pending: logs.filter(l => (l.status || "").toUpperCase() === "PENDING" || !l.status).length,
    inTransit: logs.filter(l => (l.status || "").toUpperCase() === "IN_TRANSIT" || (l.status || "").toUpperCase() === "DISPATCHED").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Logs"
        description="Monitor certificate delivery, dispatch, and fulfillment status"
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All delivery records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-blue-600">{stats.inTransit}</div>
            <p className="text-xs text-muted-foreground mt-1">En route to recipient</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-amber-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting dispatch</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by holder name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
            <SelectItem value="DISPATCHED">Dispatched</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Methods</SelectItem>
            <SelectItem value="COURIER">Courier</SelectItem>
            <SelectItem value="HAND_DELIVERY">Hand Delivery</SelectItem>
            <SelectItem value="MAIL">Mail</SelectItem>
            <SelectItem value="DIGITAL">Digital</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Delivery Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Log Entries</CardTitle>
          <CardDescription>
            {total} records across {totalPages} pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No delivery logs found. Use filters to narrow results.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate #</TableHead>
                  <TableHead>Holder</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Job #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Printed By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono font-semibold text-primary">
                      {log.certificateNumber || "—"}
                    </TableCell>
                    <TableCell>{log.holderName || "—"}</TableCell>
                    <TableCell>{log.holderCompany || log.customerName || "—"}</TableCell>
                    <TableCell>
                      {log.course ? (
                        <span className="text-sm">
                          {log.course}
                          {log.courseCode && <span className="text-muted-foreground"> ({log.courseCode})</span>}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {log.jobNumber ? (
                        <span className="font-mono">{log.jobNumber}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {log.customerName ? (
                        <span>
                          {log.customerName}
                          {log.customerNumber && <span className="text-muted-foreground block text-xs">{log.customerNumber}</span>}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getMethodBadgeVariant(log.method)}
                        className={getMethodBadgeClass(log.method)}
                      >
                        {getMethodText(log.method)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(log.status)}
                        className={getStatusBadgeClass(log.status)}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(log.status)}
                          {getStatusText(log.status)}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.printedBy ? (
                        <span>
                          {log.printedBy}
                          {log.printedByEmail && <span className="text-muted-foreground block text-xs">{log.printedByEmail}</span>}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.deliveryDate ? format(new Date(log.deliveryDate), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {log.certificateNumber && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => downloadPDF(log)}
                              title="Download Certificate PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openVerification(log)}
                              title="Verify Certificate"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {log.paymentMethod && (
                          <Badge
                            variant={getPaymentBadgeVariant(log.paymentMethod)}
                            className={getPaymentBadgeClass(log.paymentMethod, log.paymentStatus)}
                            title={`Payment: ${log.paymentMethod} - ${log.paymentStatus || "N/A"}`}
                          >
                            {log.paymentMethod}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || loading}
              onClick={() => fetchLogs(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || loading}
              onClick={() => fetchLogs(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
