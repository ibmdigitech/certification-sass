"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Truck,
  Award,
  Users,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  FileSignature,
  Building,
  TrendingUp,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

interface InspectorStat {
  id: number;
  name: string;
  completed: number;
  notCompleted: number;
}

interface DashboardPayload {
  stats: {
    totalTrainees: number;
    activeCourses: number;
    pendingCourses: number;
    upcomingSessions: number;
    competencyGaps: number;
    totalCertificates: number;
    activeJobs: number;
    completedJobs: number;
    completedSessions: number;
  };
  operationalSummary: {
    jobPerformingCount: number;
    deliveryCount: number;
    certificateCount: number;
    jobBreakdown: { draft: number; submitted: number; completed: number; cancelled: number };
    deliveryBreakdown: { draft: number; approved: number; cancelled: number };
    certificateBreakdown: { draft: number; approved: number; cancelled: number };
  };
  inspectionDashboard: {
    inspectorStats: InspectorStat[];
    rejectionReportsCount: number;
    reportsNeedCertificateCount: number;
    failureReportsNeedsApprovalCount: number;
    failureApprovedReportsCount: number;
    certificateRevisions: any[];
    certificateTeamPerformance: any[];
  };
  salesDashboard: {
    customersCreated: number;
    inquiriesPrepared: number;
    quotationsPrepared: number;
    quotationsApproved: number;
  };
  recentActivity: any[];
  expiringCertificates: any[];
  revisedCertificates: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>("rejection");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to fetch dashboard metrics");
        const json: DashboardPayload = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const op = data?.operationalSummary ?? {
    jobPerformingCount: 0,
    deliveryCount: 0,
    certificateCount: 0,
    jobBreakdown: { draft: 0, submitted: 0, completed: 0, cancelled: 0 },
    deliveryBreakdown: { draft: 0, approved: 0, cancelled: 0 },
    certificateBreakdown: { draft: 0, approved: 0, cancelled: 0 },
  };

  const insp = data?.inspectionDashboard ?? {
    inspectorStats: [],
    rejectionReportsCount: 0,
    reportsNeedCertificateCount: 0,
    failureReportsNeedsApprovalCount: 0,
    failureApprovedReportsCount: 0,
    certificateRevisions: [],
    certificateTeamPerformance: [],
  };

  const sales = data?.salesDashboard ?? {
    customersCreated: 0,
    inquiriesPrepared: 0,
    quotationsPrepared: 0,
    quotationsApproved: 0,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Quick Access (Matches Screenshot Header) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Executive Operational Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Connected UAE Technical Services & Certification Operations Platform (EIAC & ENAS Scope)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/sales/inquiries">
              <Search className="h-4 w-4 mr-1 text-primary" />
              Inspection Inquiry
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/inspections">
              <FileText className="h-4 w-4 mr-1 text-primary" />
              Inspection Report
            </Link>
          </Button>
          <Badge variant="secondary" className="px-3 py-1 font-semibold text-xs">
            2026 Active Cycle
          </Badge>
        </div>
      </div>

      {/* Top 3 KPI Summary Cards (Matches Screenshot Page 1) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-t-4 border-t-amber-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              Operational Work
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold">{op.jobPerformingCount.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Job Performing Total</span>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
                Active Field Tasks
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              Delivery Confirmation
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold">{op.deliveryCount.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Delivery Confirmation (DC)</span>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">
                Logistics & Client Handover
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-emerald-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              Official Certificates
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold">{op.certificateCount.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Issued Certificates</span>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                Accredited & QR-Verified
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Status Section (Matches Horizontal Bars on Screenshot Page 1) */}
      <Card className="border shadow-sm bg-gradient-to-r from-card to-muted/20">
        <CardHeader className="py-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-semibold">
            <div className="text-amber-700 dark:text-amber-400">Job Performing Status</div>
            <div className="text-blue-700 dark:text-blue-400">DC (Delivery Confirmation) Status</div>
            <div className="text-emerald-700 dark:text-emerald-400">Certificates Lifecycle</div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Job Performing Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>DRAFT</span>
                <span>{op.jobBreakdown.draft}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-amber-400 h-2 rounded-full" style={{ width: '25%' }} />
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>SUBMITTED</span>
                <span>{op.jobBreakdown.submitted}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '45%' }} />
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>COMPLETED</span>
                <span>{op.jobBreakdown.completed}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '80%' }} />
              </div>
            </div>

            {/* Delivery Confirmation Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>DRAFT</span>
                <span>{op.deliveryBreakdown.draft}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-blue-300 h-2 rounded-full" style={{ width: '20%' }} />
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>APPROVED</span>
                <span>{op.deliveryBreakdown.approved}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }} />
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>CANCELLED</span>
                <span>0</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-muted-foreground/30 h-2 rounded-full" style={{ width: '5%' }} />
              </div>
            </div>

            {/* Certificates Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>DRAFT / REVIEW</span>
                <span>{op.certificateBreakdown.draft}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-emerald-300 h-2 rounded-full" style={{ width: '20%' }} />
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>APPROVED / ISSUED</span>
                <span>{op.certificateBreakdown.approved}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '85%' }} />
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>CANCELLED</span>
                <span>0</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-muted-foreground/30 h-2 rounded-full" style={{ width: '5%' }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs: Inspection Dashboard vs Sales Dashboard vs Training */}
      <Tabs defaultValue="inspection" className="space-y-6">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="inspection">Inspection Dashboard</TabsTrigger>
          <TabsTrigger value="sales">Sales Dashboard</TabsTrigger>
          <TabsTrigger value="training">Training & Trainees</TabsTrigger>
        </TabsList>

        {/* Tab 1: Inspection Dashboard (Matches Page 1 & 5) */}
        <TabsContent value="inspection" className="space-y-6">
          {/* DC Summary: Completed vs NOT Completed Inspectors */}
          <Card>
            <CardHeader className="bg-muted/30 pb-3">
              <CardTitle className="text-base font-semibold">DC Summary (Inspector Field Output)</CardTitle>
              <CardDescription>Individual completion rates and delivery confirmations by assigned engineer</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Completed Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-semibold text-sm text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Completed Inspections
                  </div>
                  {insp.inspectorStats.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No inspectors assigned yet.</p>
                  ) : (
                    insp.inspectorStats.map((item) => (
                      <div key={item.id} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span>{item.name}</span>
                          <span className="font-bold text-emerald-600">{item.completed}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, Math.max(15, item.completed * 10))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* NOT Completed Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-semibold text-sm text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    NOT Completed (Pending Actions)
                  </div>
                  {insp.inspectorStats.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No pending items.</p>
                  ) : (
                    insp.inspectorStats.map((item) => (
                      <div key={item.id} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span>{item.name}</span>
                          <span className="font-bold text-amber-600">{item.notCompleted}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-amber-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, Math.max(10, item.notCompleted * 15))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collapsible Operational Queues (Matches Page 1 & 5 Accordions) */}
          <div className="space-y-3">
            {/* Rejection Reports */}
            <div className="border rounded-lg bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenAccordion(openAccordion === "rejection" ? null : "rejection")}
                className="w-full flex items-center justify-between p-4 bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
              >
                <div className="flex items-center gap-2">
                  {openAccordion === "rejection" ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <span>Rejection Reports (Corrective Action Queue)</span>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 text-xs px-2.5">
                  {insp.rejectionReportsCount}
                </Badge>
              </button>
              {openAccordion === "rejection" && (
                <div className="p-4 space-y-3 bg-muted/10">
                  <p className="text-xs text-muted-foreground">
                    Equipment inspection records rejected due to safety non-conformances requiring corrective-action or re-inspection.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/inspections/findings">View Rejection Findings Register</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Reports Need Certificate */}
            <div className="border rounded-lg bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenAccordion(openAccordion === "needCert" ? null : "needCert")}
                className="w-full flex items-center justify-between p-4 bg-cyan-700 text-white font-medium hover:bg-cyan-800 transition"
              >
                <div className="flex items-center gap-2">
                  {openAccordion === "needCert" ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <span>Reports Need Certificate</span>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 text-xs px-2.5">
                  {insp.reportsNeedCertificateCount}
                </Badge>
              </button>
              {openAccordion === "needCert" && (
                <div className="p-4 space-y-3 bg-muted/10">
                  <p className="text-xs text-muted-foreground">
                    Approved technical reports ready for certificate number allocation and QR stamping.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/certificates">Generate Pending Certificates</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Failure Reports Needs Approval */}
            <div className="border rounded-lg bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenAccordion(openAccordion === "failureNeedsAppr" ? null : "failureNeedsAppr")}
                className="w-full flex items-center justify-between p-4 bg-emerald-700 text-white font-medium hover:bg-emerald-800 transition"
              >
                <div className="flex items-center gap-2">
                  {openAccordion === "failureNeedsAppr" ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <span>Failure Reports Needs Approval</span>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 text-xs px-2.5">
                  {insp.failureReportsNeedsApprovalCount}
                </Badge>
              </button>
              {openAccordion === "failureNeedsAppr" && (
                <div className="p-4 space-y-3 bg-muted/10">
                  <p className="text-xs text-muted-foreground">
                    Failed asset reports awaiting final Technical Manager sign-off and client notification.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/inspections/review">Review Failure Reports</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Failure - Approved Reports */}
            <div className="border rounded-lg bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenAccordion(openAccordion === "failureApproved" ? null : "failureApproved")}
                className="w-full flex items-center justify-between p-4 bg-teal-800 text-white font-medium hover:bg-teal-900 transition"
              >
                <div className="flex items-center gap-2">
                  {openAccordion === "failureApproved" ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <span>Failure - Approved Reports</span>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 text-xs px-2.5">
                  {insp.failureApprovedReportsCount}
                </Badge>
              </button>
              {openAccordion === "failureApproved" && (
                <div className="p-4 space-y-3 bg-muted/10">
                  <p className="text-xs text-muted-foreground">
                    Historical register of approved rejection certificates and notices issued to clients.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/inspections">Browse Historical Failure Reports</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Certificate Revisions Section */}
          <div className="border rounded-lg bg-card overflow-hidden mt-4">
            <button
              type="button"
              onClick={() => setOpenAccordion(openAccordion === "revisions" ? null : "revisions")}
              className="w-full flex items-center justify-between p-4 bg-purple-700 text-white font-medium hover:bg-purple-800 transition"
            >
              <div className="flex items-center gap-2">
                {openAccordion === "revisions" ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                <span>Certificate Revisions Report</span>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 text-xs px-2.5">
                {insp.certificateRevisions?.length || 0}
              </Badge>
            </button>
            {openAccordion === "revisions" && (
              <div className="p-4 space-y-3 bg-muted/10">
                <p className="text-xs text-muted-foreground">
                  Certificates requiring revisions. Shows job number, revision count, and which certification team member made corrections.
                </p>
                {insp.certificateRevisions?.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No certificate revisions pending.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2">Certificate Number</th>
                          <th className="pb-2">Job Number</th>
                          <th className="pb-2">Revision</th>
                          <th className="pb-2">Created By</th>
                          <th className="pb-2">Approved By</th>
                          <th className="pb-2">Revisions By</th>
                          <th className="pb-2">Root Cause</th>
                          <th className="pb-2">Last Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {insp.certificateRevisions.map((cert: any) => (
                          <tr key={cert.id} className="border-b">
                            <td className="py-2 font-mono">{cert.number}</td>
                            <td className="py-2">{cert.jobNumber || 'N/A'}</td>
                            <td className="py-2">R{cert.revision}</td>
                            <td className="py-2">{cert.createdByName || '—'}</td>
                            <td className="py-2">{cert.approvedByName || '—'}</td>
                            <td className="py-2">{cert.revisions.join(', ') || '—'}</td>
                            <td className="py-2">{cert.rootCauses.join('; ') || '—'}</td>
                            <td className="py-2">{new Date(cert.updatedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase font-semibold">Customers Created</CardDescription>
                <CardTitle className="text-2xl font-bold">{sales.customersCreated.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Active enterprise client accounts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase font-semibold">Inquiries Prepared</CardDescription>
                <CardTitle className="text-2xl font-bold">{sales.inquiriesPrepared.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Sales leads & commercial tenders</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase font-semibold">Quotations Prepared</CardDescription>
                <CardTitle className="text-2xl font-bold">{sales.quotationsPrepared.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Issued service proposals</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase font-semibold text-emerald-600">Quotations Approved</CardDescription>
                <CardTitle className="text-2xl font-bold text-emerald-600">{sales.quotationsApproved.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Converted to Job Orders</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sales Pipeline Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Commercial Conversion Funnel</CardTitle>
                <CardDescription>From customer inquiry to quotation acceptance and job order creation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>1. Inquiries Received</span>
                    <span className="font-bold">{sales.inquiriesPrepared}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div className="bg-sky-500 h-3 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>2. Quotations Formulated</span>
                    <span className="font-bold">{sales.quotationsPrepared}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div className="bg-indigo-500 h-3 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>3. Client Approved Proposals</span>
                    <span className="font-bold">{sales.quotationsApproved}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div className="bg-emerald-500 h-3 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>4. Converted Job Orders</span>
                    <span className="font-bold">{op.jobPerformingCount}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div className="bg-amber-500 h-3 rounded-full" style={{ width: '50%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Sales & Operations Shortcuts</CardTitle>
                <CardDescription>Rapid access to commercial pipelines and catalogs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="justify-start h-auto py-3" asChild>
                    <Link href="/sales/inquiries">
                      <FileText className="h-4 w-4 mr-2 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold text-xs">New Inquiry</div>
                        <div className="text-[10px] text-muted-foreground">Register incoming lead</div>
                      </div>
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-3" asChild>
                    <Link href="/sales/quotations">
                      <FileSignature className="h-4 w-4 mr-2 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold text-xs">New Quotation</div>
                        <div className="text-[10px] text-muted-foreground">Create pricing offer</div>
                      </div>
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-3" asChild>
                    <Link href="/customers">
                      <Building className="h-4 w-4 mr-2 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold text-xs">Customers</div>
                        <div className="text-[10px] text-muted-foreground">Directory & sites</div>
                      </div>
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-3" asChild>
                    <Link href="/setup/job-types">
                      <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold text-xs">Job Types</div>
                        <div className="text-[10px] text-muted-foreground">EIAC / ENAS Scopes</div>
                      </div>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Training & Trainees */}
        <TabsContent value="training" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Total Trainees</CardDescription>
                <CardTitle className="text-2xl font-bold">{data?.stats.totalTrainees}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Active Courses</CardDescription>
                <CardTitle className="text-2xl font-bold">{data?.stats.activeCourses}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Upcoming Sessions</CardDescription>
                <CardTitle className="text-2xl font-bold">{data?.stats.upcomingSessions}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Competency Gaps</CardDescription>
                <CardTitle className="text-2xl font-bold text-amber-500">{data?.stats.competencyGaps}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Revised Certificates Report for Training */}
          {data?.revisedCertificates && data.revisedCertificates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Revised Certificates Report</CardTitle>
                <CardDescription>
                  Training certificates that were revised - track which certification team member made corrections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2">Certificate Number</th>
                        <th className="pb-2">Job Number</th>
                        <th className="pb-2">Revision</th>
                        <th className="pb-2">Created By</th>
                        <th className="pb-2">Approved By</th>
                        <th className="pb-2">Revised By</th>
                        <th className="pb-2">Root Cause</th>
                        <th className="pb-2">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.revisedCertificates.map((cert: any) => (
                        <tr key={cert.id} className="border-b">
                          <td className="py-2 font-mono">{cert.number}</td>
                          <td className="py-2">{cert.jobNumber || 'N/A'}</td>
                          <td className="py-2">R{cert.revision}</td>
                          <td className="py-2">{cert.createdByName || '—'}</td>
                          <td className="py-2">{cert.approvedByName || '—'}</td>
                          <td className="py-2">{cert.revisions.join(', ') || '—'}</td>
                          <td className="py-2">{cert.rootCauses.join('; ') || '—'}</td>
                          <td className="py-2">{new Date(cert.updatedAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
