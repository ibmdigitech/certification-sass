"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, FileText, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";

interface OverviewStats {
  totalInspections: number;
  inspectionsInProgress: number;
  inspectionsScheduled: number;
  completedInspections: number;
  totalReports: number;
  reportsPendingReview: number;
  reportsApproved: number;
  reportsRejected: number;
  totalFailures: number;
  openFailureWorkflows: number;
  totalCertificates: number;
  expiringCertificates: number;
}

export default function InspectionsOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/inspections/overview");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch overview:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const statCards = [
    { name: "Total Inspections", value: stats.totalInspections, icon: ClipboardCheck, sub: `${stats.completedInspections} completed` },
    { name: "In Progress", value: stats.inspectionsInProgress, icon: Clock, sub: `${stats.inspectionsScheduled} scheduled` },
    { name: "Reports", value: stats.totalReports, icon: FileText, sub: `${stats.reportsPendingReview} pending review` },
    { name: "Certificates", value: stats.totalCertificates, icon: CheckCircle2, sub: `${stats.expiringCertificates} expiring soon` },
    { name: "Failures", value: stats.totalFailures, icon: AlertTriangle, sub: `${stats.openFailureWorkflows} open` },
    { name: "Report Status", value: `${stats.reportsApproved}/${stats.totalReports}`, icon: XCircle, sub: `${stats.reportsRejected} rejected` },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Inspection Certification Overview</h1>
        <p className="text-muted-foreground mt-2">
          Monitor inspection activities, report statuses, and failure workflows.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
