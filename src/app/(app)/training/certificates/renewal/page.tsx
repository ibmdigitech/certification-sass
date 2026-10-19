"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { FileCheck2, Search, RefreshCw, Clock, AlertTriangle, Copy } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Certificate {
  id: number;
  number: string;
  status: string;
  issueDate: string | null;
  expiryDate: string | null;
  holderName: string | null;
  holderCompany: string | null;
  course: { title: string; code: string | null; certificateValidityMonths: number | null } | null;
  emiratesId: string | null;
  passportNumber: string | null;
  visaNumber: string | null;
  licenseNumber: string | null;
  idTypeUsed: string | null;
  photoUrl: string | null;
  renewedFromId: number | null;
  renewedFrom: { id: number; number: string } | null;
  renewals: Array<{ id: number; number: string; status: string; issueDate: string }>;
  createdAt: string;
}

export default function CertificateRenewalPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [renewalMonths, setRenewalMonths] = useState("");
  const [renewing, setRenewing] = useState(false);
  const [error, setError] = useState("");

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("certificateType", "TRAINING");
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter) params.append("status", statusFilter);
      const res = await fetch(`/api/certificates/renew?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCertificates(data.certificates || []);
      }
    } catch (error) {
      console.error("Failed to fetch certificates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      ISSUED: "bg-emerald-500/15 text-emerald-500",
      RENEWED: "bg-blue-500/15 text-blue-500",
      EXPIRED: "bg-red-500/15 text-red-500",
      DRAFT: "bg-amber-500/15 text-amber-500",
      REVOKED: "bg-slate-500/15 text-slate-500",
    };
    const className = variants[status.toUpperCase()] || "bg-slate-500/15 text-slate-500";
    return <Badge className={className}>{status}</Badge>;
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffMonths = (expiry.getFullYear() - now.getFullYear()) * 12 + expiry.getMonth() - now.getMonth();
    return diffMonths <= 3 && diffMonths >= 0;
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const openRenewDialog = (cert: Certificate) => {
    setSelectedCert(cert);
    setRenewalMonths(cert.course?.certificateValidityMonths?.toString() || "36");
    setError("");
    setIsDialogOpen(true);
  };

  const handleRenew = async () => {
    if (!selectedCert || !renewalMonths) return;
    setRenewing(true);
    setError("");
    try {
      const res = await fetch("/api/certificates/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificateId: selectedCert.id,
          newExpiryMonths: parseInt(renewalMonths),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsDialogOpen(false);
        fetchCertificates();
      } else {
        setError(data.error || "Failed to renew certificate");
      }
    } catch (error) {
      console.error("Failed to renew certificate:", error);
      setError("Failed to renew certificate");
    } finally {
      setRenewing(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Certificate Renewal Management"
        description="Search and renew expiring training certificates. Expired certificates are highlighted."
      />

      <div className="flex flex-wrap gap-4 mb-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by certificate number, holder name, Emirates ID, Passport..."
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
            <SelectItem value="ISSUED">Issued</SelectItem>
            <SelectItem value="RENEWED">Renewed</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="REVOKED">Revoked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : certificates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileCheck2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No certificates found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate No.</TableHead>
                  <TableHead>Holder</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>ID Type</TableHead>
                  <TableHead>ID Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Renewals</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((cert) => {
                  const expiring = isExpiringSoon(cert.expiryDate);
                  const expired = isExpired(cert.expiryDate);
                  const idValue = cert.idTypeUsed === 'PASSPORT' ? cert.passportNumber :
                                 cert.idTypeUsed === 'VISA' ? cert.visaNumber :
                                 cert.idTypeUsed === 'LICENSE' ? cert.licenseNumber :
                                 cert.emiratesId;

                  return (
                    <TableRow key={cert.id} className={expired ? "bg-red-50" : expiring ? "bg-amber-50" : ""}>
                      <TableCell className="font-mono text-sm">{cert.number}</TableCell>
                      <TableCell>
                        <p className="font-medium">{cert.holderName || "-"}</p>
                        {cert.holderCompany && <p className="text-sm text-muted-foreground">{cert.holderCompany}</p>}
                      </TableCell>
                      <TableCell>{cert.course?.title || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{cert.idTypeUsed || "EMIRATES_ID"}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{idValue || "-"}</TableCell>
                      <TableCell>{getStatusBadge(cert.status)}</TableCell>
                      <TableCell>{cert.issueDate ? format(new Date(cert.issueDate), "PP") : "-"}</TableCell>
                      <TableCell>
                        {cert.expiryDate ? (
                          <Badge
                            variant={expired ? "destructive" : expiring ? "default" : "secondary"}
                            className={expired ? "bg-red-500/15 text-red-500" : expiring ? "bg-amber-500/15 text-amber-500" : "bg-emerald-500/15 text-emerald-500"}
                          >
                            {format(new Date(cert.expiryDate), "PP")}
                            {expired && <AlertTriangle className="ml-1 h-3 w-3" />}
                            {expiring && !expired && <Clock className="ml-1 h-3 w-3" />}
                          </Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {cert.renewals.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {cert.renewals.map((r) => (
                              <Badge key={r.id} variant="outline" className="text-xs">
                                {r.number} ({r.status})
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {cert.status === "ISSUED" && (expiring || expired) && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openRenewDialog(cert)}
                              className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                              disabled={cert.renewals.some(r => r.status === "ISSUED" || r.status === "DRAFT")}
                            >
                              <RefreshCw className="h-3 w-3" />
                              Renew
                            </Button>
                          )}
                          {cert.renewedFromId && (
                            <Button variant="ghost" size="icon" className="text-muted-foreground" title={`Renewed from ${cert.renewedFrom?.number}`}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew Certificate: {selectedCert?.number}</DialogTitle>
          </DialogHeader>
          {error && (
            <Alert variant="destructive" className="mx-4 mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 p-4">
            <div>
              <p className="text-sm font-medium">Holder: {selectedCert?.holderName}</p>
              <p className="text-sm text-muted-foreground">Course: {selectedCert?.course?.title}</p>
              <p className="text-sm text-muted-foreground">Current Expiry: {selectedCert?.expiryDate ? format(new Date(selectedCert.expiryDate), "PP") : "N/A"}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="renewalMonths">New Validity Period (months)</Label>
              <Select value={renewalMonths} onValueChange={setRenewalMonths}>
                <SelectTrigger>
                  <SelectValue placeholder="Select validity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 months (1 year)</SelectItem>
                  <SelectItem value="24">24 months (2 years)</SelectItem>
                  <SelectItem value="36">36 months (3 years)</SelectItem>
                  <SelectItem value="48">48 months (4 years)</SelectItem>
                  <SelectItem value="60">60 months (5 years)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              This will create a new certificate with the same holder details and ID information, 
              linked to the original certificate for traceability.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={renewing}>
              Cancel
            </Button>
            <Button onClick={handleRenew} disabled={renewing}>
              {renewing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
              Renew Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const dynamic = "force-dynamic";