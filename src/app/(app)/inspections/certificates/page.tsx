"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { FileCheck2, Search, ExternalLink, Download, FileText, QrCode, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface InspectionCertificate {
  id: number;
  number: string;
  status: string;
  issueDate: string | null;
  expiryDate: string | null;
  certificateType: string | null;
  holderName: string | null;
  holderCompany: string | null;
  job: { jobNumber: string; customer: { contact: string | null } } | null;
  pdfUrl: string | null;
  qrUrl: string | null;
  deliveryLogs: Array<{
    id: number;
    deliveryDate: string | null;
    method: string | null;
    status: string | null;
    createdAt: string;
  }> | null;
  createdAt: string;
}

export default function InspectionCertificatesPage() {
  const [certificates, setCertificates] = useState<InspectionCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("certificateType", "INSPECTION");
      if (searchQuery) params.append("search", searchQuery);
      const res = await fetch(`/api/certificates?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCertificates(data.certificates || data);
      }
    } catch (error) {
      console.error("Failed to fetch certificates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [searchQuery]);

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      ISSUED: "bg-emerald-500/15 text-emerald-500",
      REVOKED: "bg-red-500/15 text-red-500",
      EXPIRED: "bg-slate-500/15 text-slate-500",
      DRAFT: "bg-amber-500/15 text-amber-500",
    };
    const className = variants[status.toUpperCase()] || "bg-slate-500/15 text-slate-500";
    return <Badge className={className}>{status}</Badge>;
  };

  const getPrintStatus = (deliveryLogs: Array<{ status: string | null }> | null | undefined) => {
    if (!deliveryLogs || deliveryLogs.length === 0) {
      return <Badge variant="outline" className="text-xs">Not Printed</Badge>;
    }
    const hasPrinted = deliveryLogs.some(log => log.status === 'PRINTED' || log.status === 'DOWNLOAD');
    return hasPrinted
      ? <Badge variant="default" className="bg-blue-500/15 text-blue-500 border-blue-500/20 text-xs">Printed</Badge>
      : <Badge variant="outline" className="text-xs">Delivered</Badge>;
  };

  const downloadPDF = async (certificate: InspectionCertificate) => {
    if (!certificate.pdfUrl) {
      alert("PDF not available for this certificate");
      return;
    }
    try {
      await fetch(`/api/certificates/${certificate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordPrint: true }),
      });

      const pdfUrl = certificate.pdfUrl;
      let blob: Blob;

      if (pdfUrl.startsWith('data:application/pdf;base64,')) {
        const base64Data = pdfUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: 'application/pdf' });
      } else {
        const response = await fetch(pdfUrl);
        if (!response.ok) throw new Error("Failed to fetch PDF");
        blob = await response.blob();
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${certificate.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download certificate:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to download PDF: ${errorMessage}`);
    }
  };

  const downloadQRCode = async (certificate: InspectionCertificate) => {
    try {
      if (!certificate.qrUrl) {
        // Auto-generate QR code on download
        const qrRes = await fetch(`/api/certificates/${certificate.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ generateQr: true }),
        });
        if (!qrRes.ok) throw new Error("Failed to generate QR code");
        const qrResult = await qrRes.json();
        if (!qrResult.qrUrl) throw new Error("QR code not generated");
        certificate.qrUrl = qrResult.qrUrl;
      }

      if (!certificate.qrUrl) {
        throw new Error("QR code not available");
      }

      const response = await fetch(certificate.qrUrl);
      if (!response.ok) throw new Error("Failed to fetch QR code");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${certificate.number}-qr.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download QR code:", error);
      alert("Failed to download QR code");
    }
  };

  const openVerification = (certificate: InspectionCertificate) => {
    const url = `/verify/${certificate.number}`;
    window.open(url, "_blank");
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Inspection Certificates"
        description="Issued inspection certificates with status and expiry tracking."
      />

      <div className="relative flex-1 min-w-[200px] mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by certificate number or job..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
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
            <p className="text-muted-foreground">No inspection certificates found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-0">
            <Table>
               <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Holder</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Print Status</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell className="font-mono text-sm">{cert.number}</TableCell>
                    <TableCell>{cert.holderName || "-"}</TableCell>
                    <TableCell>{cert.holderCompany || "-"}</TableCell>
                    <TableCell>{cert.job?.jobNumber || "-"}</TableCell>
                    <TableCell>{statusBadge(cert.status)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          cert.expiryDate && new Date(cert.expiryDate) < new Date()
                            ? "destructive"
                            : cert.status === "ISSUED"
                            ? "default"
                            : "secondary"
                        }
                        className={
                          cert.expiryDate && new Date(cert.expiryDate) < new Date()
                            ? "bg-red-500/15 text-red-500"
                            : "bg-emerald-500/15 text-emerald-500"
                        }
                      >
                        {cert.expiryDate && new Date(cert.expiryDate) < new Date() ? "Expired" : "Valid"}
                      </Badge>
                    </TableCell>
                    <TableCell>{getPrintStatus(cert.deliveryLogs)}</TableCell>
                    <TableCell>{cert.issueDate ? format(new Date(cert.issueDate), 'PP') : "-"}</TableCell>
                    <TableCell>{cert.expiryDate ? format(new Date(cert.expiryDate), 'PP') : "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {cert.status.toLowerCase() === 'draft' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Issue certificate ${cert.number}? This will change status from Draft to Issued.`)) {
                                fetch(`/api/certificates/${cert.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ action: "issue", reason: "Certificate processed and issued" }),
                                }).then(res => {
                                  if (res.ok) fetchCertificates();
                                  else alert("Failed to issue certificate");
                                }).catch(() => alert("Failed to issue certificate"));
                              }
                            }}
                            className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Issue
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadPDF(cert)}
                          disabled={!cert.pdfUrl}
                          className={!cert.pdfUrl ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadQRCode(cert)}
                          disabled={!cert.qrUrl}
                          className={!cert.qrUrl ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openVerification(cert)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
