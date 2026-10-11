"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, GraduationCap, Calendar, CheckCircle2, AlertTriangle, FileCheck2, Briefcase, BarChart3, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { NotificationBar } from "@/components/notifications/NotificationBar";

interface DashboardStats {
  totalTrainees: number;
  activeCourses: number;
  pendingCourses: number;
  upcomingSessions: number;
  competencyGaps: number;
  totalCertificates: number;
  activeJobs: number;
  completedJobs: number;
  completedSessions: number;
}

interface ActivityItem {
  trainee: string;
  employeeId: string | null;
  course: string;
  courseCode: string | null;
  assessment: string | null;
  score: string | null;
  status: string;
  date: string;
}

interface ExpiringCert {
  trainee: string;
  course: string;
  certificateNumber: string;
  expiresAt: string;
  daysRemaining: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentActivity: ActivityItem[];
  expiringCertificates: ExpiringCert[];
}

const statusVariants: Record<string, { variant: "default" | "outline" | "destructive"; className: string; label: string; icon: React.ElementType; }> = {
  passed: { variant: "default", className: "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20", label: "Passed", icon: CheckCircle2 },
  failed: { variant: "destructive", className: "bg-red-500/15 text-red-500 hover:bg-red-500/25 border-red-500/20", label: "Failed", icon: AlertCircle },
  in_progress: { variant: "outline", className: "text-amber-500 border-amber-500/20 bg-amber-500/10", label: "In Progress", icon: BarChart3 },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        const result: DashboardData = await res.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
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

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">{error || 'No data available'}</p>
      </div>
    );
  }

  const { stats, recentActivity, expiringCertificates } = data;

  const statCards = [
    { name: "Total Trainees", value: stats.totalTrainees, icon: Users, change: "+12% from last month" },
    { name: "Active Courses", value: stats.activeCourses, icon: GraduationCap, change: `${stats.pendingCourses} pending verification` },
    { name: "Upcoming Sessions", value: stats.upcomingSessions, icon: Calendar, change: `${stats.completedSessions} completed this month` },
    { name: "Competency Gaps", value: stats.competencyGaps, icon: AlertTriangle, change: "Requires attention" },
    { name: "Training Certificates", value: stats.totalCertificates, icon: FileCheck2, change: "Issued & active" },
    { name: "Active Jobs", value: stats.activeJobs, icon: Briefcase, change: `${stats.completedJobs} completed this month` },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-2">
          Monitor training progress, active sessions, and compliance statuses.
        </p>
      </div>

      {/* Notification Bar */}
      <NotificationBar />

      {/* Stats Grid */}
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
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Training Activities</CardTitle>
            <CardDescription>
              A snapshot of the most recent training sessions and assessments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trainee</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No recent training activity
                    </TableCell>
                  </TableRow>
                ) : (
                  recentActivity.map((activity, i) => {
                    const statusConfig = statusVariants[activity.status] ?? statusVariants.in_progress;
                    const StatusIcon = statusConfig.icon;
                    return (
                      <TableRow key={`${activity.trainee}-${i}`}>
                        <TableCell className="font-medium">{activity.trainee}</TableCell>
                        <TableCell>{activity.course}</TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant} className={statusConfig.className}>
                            <StatusIcon className="w-3 h-3 mr-1" /> {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {format(new Date(activity.date), 'PPp')}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Expiring Certificates</CardTitle>
            <CardDescription>
              Trainees who need recertification soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {expiringCertificates.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No certificates expiring soon
              </div>
            ) : (
              expiringCertificates.map((cert) => (
                <div key={cert.certificateNumber} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <FileCheck2 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{cert.trainee}</p>
                    <p className="text-xs text-muted-foreground">
                      {cert.course} • expires in {cert.daysRemaining} days
                    </p>
                  </div>
                  <Badge
                    variant={cert.daysRemaining <= 30 ? "destructive" : "outline"}
                    className={
                      cert.daysRemaining <= 30
                        ? "bg-red-500/15 text-red-500 border-red-500/20"
                        : "text-amber-500 border-amber-500/20 bg-amber-500/10"
                    }
                  >
                    {cert.daysRemaining <= 30 ? 'Urgent' : `${cert.daysRemaining}d`}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
