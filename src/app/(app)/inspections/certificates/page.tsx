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
import { FileCheck2, Search } from "lucide-react";
import { format } from "date-fns";

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
                  <TableHead>Issued</TableHead>
                  <TableHead>Expires</TableHead>
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
                    <TableCell>{cert.issueDate ? format(new Date(cert.issueDate), 'PP') : "-"}</TableCell>
                    <TableCell>
                      {cert.expiryDate ? (
                        <Badge
                          variant={new Date(cert.expiryDate) < new Date() ? "destructive" : "default"}
                          className={
                            new Date(cert.expiryDate) < new Date()
                              ? "bg-red-500/15 text-red-500"
                              : "bg-emerald-500/15 text-emerald-500"
                          }
                        >
                          {format(new Date(cert.expiryDate), 'PP')}
                        </Badge>
                      ) : "-"}
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
