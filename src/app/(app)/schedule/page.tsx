"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  UserCheck,
  CalendarDays,
  AlertCircle,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Filter,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function SchedulePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("ALL");

  useEffect(() => {
    fetch("/api/schedule")
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

  const scheduled = data?.scheduledServices || [];
  const unscheduled = data?.unscheduledServices || [];
  const stats = data?.stats || { totalScheduled: 0, totalUnscheduled: 0, trainingCount: 0, inspectionCount: 0 };

  const filteredScheduled = scheduled.filter((s: any) => {
    if (filterType === "ALL") return true;
    return s.serviceType === filterType;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule & Dispatch Calendar"
        description="Global timeline for all Training sessions, Field Inspections, and Assigned Personnel"
      />

      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Services</CardTitle>
            <CalendarDays className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600">{stats.totalScheduled}</div>
            <p className="text-xs text-muted-foreground mt-1">Confirmed dates & personnel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Scheduling</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-amber-600">{stats.totalUnscheduled}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting date / staff booking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Activities</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats.trainingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Courses & sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Field Inspections</CardTitle>
            <Briefcase className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats.inspectionCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Equipment examinations</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={filterType === "ALL" ? "default" : "outline"}
          onClick={() => setFilterType("ALL")}
        >
          All Scheduled ({scheduled.length})
        </Button>
        <Button
          size="sm"
          variant={filterType === "TRAINING" ? "default" : "outline"}
          onClick={() => setFilterType("TRAINING")}
        >
          Training Only
        </Button>
        <Button
          size="sm"
          variant={filterType === "INSPECTION" ? "default" : "outline"}
          onClick={() => setFilterType("INSPECTION")}
        >
          Inspections Only
        </Button>
      </div>

      <Tabs defaultValue="scheduled" className="w-full">
        <TabsList>
          <TabsTrigger value="scheduled">Scheduled Timeline ({filteredScheduled.length})</TabsTrigger>
          <TabsTrigger value="unscheduled">Needs Scheduling ({unscheduled.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Execution Schedule</CardTitle>
              <CardDescription>Chronological timeline of active training sessions and inspection examinations</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredScheduled.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No scheduled items match the filter.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Job Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Scheduled Window</TableHead>
                      <TableHead>Assigned Personnel</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredScheduled.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Badge
                            className={
                              s.serviceType === "TRAINING"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200"
                                : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200"
                            }
                          >
                            {s.serviceType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link href={`/jobs/${s.job?.id}`} className="text-primary hover:underline font-mono">
                            {s.job?.jobNumber || `Job #${s.jobId}`}
                          </Link>
                        </TableCell>
                        <TableCell>{s.job?.customer?.contact || "—"}</TableCell>
                        <TableCell>
                          <div className="text-xs font-medium">
                            {s.scheduledStart ? format(new Date(s.scheduledStart), "MMM d, yyyy · HH:mm") : "—"}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            to {s.scheduledEnd ? format(new Date(s.scheduledEnd), "HH:mm") : "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {s.assignedResponsible ? (
                            <div>
                              <span className="font-medium text-xs">{s.assignedResponsible.name}</span>
                              <div className="text-[10px] text-muted-foreground">{s.assignedResponsible.email}</div>
                            </div>
                          ) : (
                            <span className="text-amber-600 text-xs font-medium">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {s.job?.location ? `[${s.job.location.code}] ${s.job.location.name}` : "Client Site"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/jobs/${s.job?.id}`}>
                            <Button size="sm" variant="ghost">Manage</Button>
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

        <TabsContent value="unscheduled">
          <Card>
            <CardHeader>
              <CardTitle>Unscheduled Service Requests</CardTitle>
              <CardDescription>Job services created that require immediate date & trainer/inspector assignment</CardDescription>
            </CardHeader>
            <CardContent>
              {unscheduled.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  All job service lines are currently scheduled!
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Job Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Requested Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unscheduled.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Badge variant="outline">{s.serviceType}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link href={`/jobs/${s.job?.id}`} className="text-primary hover:underline font-mono">
                            {s.job?.jobNumber || `Job #${s.jobId}`}
                          </Link>
                        </TableCell>
                        <TableCell>{s.job?.customer?.contact || "—"}</TableCell>
                        <TableCell className="text-xs">
                          {s.requestedDate ? format(new Date(s.requestedDate), "MMM d, yyyy") : "ASAP"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-amber-50 text-amber-800 border-amber-200">
                            {s.status || "PLANNED"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/jobs/${s.job?.id}`}>
                            <Button size="sm">
                              Schedule Now <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
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
