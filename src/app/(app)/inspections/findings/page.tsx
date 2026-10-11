"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Flag, Search, Eye } from "lucide-react";
import { format } from "date-fns";

interface Finding {
  id: number;
  reportNumber: string;
  title: string;
  status: string;
  severity: string;
  createdAt: string;
  updatedAt: string;
  job: { jobNumber: string; customer: { contact: string | null } } | null;
  inspection: { inspectionType: string | null } | null;
  failureWorkflows: { id: number; status: string }[];
}

export default function FindingsPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchFindings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      const res = await fetch(`/api/inspections/overview/findings?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFindings(data.findings || []);
      }
    } catch (error) {
      console.error("Failed to fetch findings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFindings();
  }, [searchQuery]);

  const severityBadge = (severity: string) => {
    const variants: Record<string, { variant: "destructive" | "default" | "outline"; label: string }> = {
      CRITICAL: { variant: "destructive", label: "Critical" },
      HIGH: { variant: "destructive", label: "High" },
      MEDIUM: { variant: "default", label: "Medium" },
      LOW: { variant: "outline", label: "Low" },
    };
    const config = variants[severity.toUpperCase()] || variants.MEDIUM;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      OPEN: "bg-red-500/15 text-red-500",
      IN_PROGRESS: "bg-amber-500/15 text-amber-500",
      RESOLVED: "bg-emerald-500/15 text-emerald-500",
      CLOSED: "bg-slate-500/15 text-slate-500",
    };
    const className = variants[status.toUpperCase()] || "bg-slate-500/15 text-slate-500";
    return <Badge className={className}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Findings"
        description="Track inspection findings, failures, and corrective actions."
      />

      <div className="relative flex-1 min-w-[200px] mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search findings by report number or job..."
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
      ) : findings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Flag className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No findings to display</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Workflows</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {findings.map((finding) => (
                  <TableRow key={finding.id}>
                    <TableCell className="font-mono text-sm">{finding.reportNumber}</TableCell>
                    <TableCell className="font-medium">{finding.title}</TableCell>
                    <TableCell>{severityBadge(finding.severity)}</TableCell>
                    <TableCell>{statusBadge(finding.status)}</TableCell>
                    <TableCell>
                      {finding.job?.jobNumber}
                      <br />
                      <span className="text-xs text-muted-foreground">{finding.job?.customer?.contact}</span>
                    </TableCell>
                    <TableCell>{finding.failureWorkflows.length}</TableCell>
                    <TableCell>{format(new Date(finding.updatedAt), 'PP')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
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
