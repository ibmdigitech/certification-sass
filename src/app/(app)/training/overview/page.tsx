"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Award,
  TrendingUp,
  BookOpen,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

interface OverviewStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  pendingVerificationCourses: number;
  totalTrainees: number;
  activeTrainees: number;
  totalSessions: number;
  upcomingSessions: number;
  completedSessions: number;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  totalCertificatesIssued: number;
  competencies: number;
  coursesByLocation: { location: string; count: number }[];
}

export default function TrainingOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/training/overview");
        if (!res.ok) throw new Error("Failed to fetch overview data");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
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

  if (error || !stats) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-muted-foreground">{error || "No data available"}</p>
      </div>
    );
  }

  const statCards = [
    { name: "Total Courses", value: stats.totalCourses, icon: BookOpen, sub: `${stats.publishedCourses} published` },
    { name: "Total Trainees", value: stats.totalTrainees, icon: Users, sub: `${stats.activeTrainees} active` },
    { name: "Upcoming Sessions", value: stats.upcomingSessions, icon: Calendar, sub: `${stats.completedSessions} completed` },
    { name: "Enrollments", value: stats.totalEnrollments, icon: GraduationCap, sub: `${stats.activeEnrollments} active` },
    { name: "Certificates Issued", value: stats.totalCertificatesIssued, icon: CheckCircle2, sub: `${stats.completionRate}% completion` },
    { name: "Competency Areas", value: stats.competencies, icon: Award, sub: "Tracked skills" },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Training Certification Overview</h1>
        <p className="text-muted-foreground mt-2">
          Monitor courses, sessions, trainee progress, and certification status.
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

      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Course Status Breakdown</CardTitle>
            <CardDescription>Distribution of training courses by status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Published</span>
                <Badge variant="default" className="bg-emerald-500/15 text-emerald-500">
                  {stats.publishedCourses}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Draft</span>
                <Badge variant="outline">{stats.draftCourses}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Verification</span>
                <Badge variant="secondary">{stats.pendingVerificationCourses}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Activity</CardTitle>
            <CardDescription>Training session status overview.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Sessions</span>
                <span className="text-lg font-semibold">{stats.totalSessions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Upcoming</span>
                <span className="text-lg font-semibold text-blue-600">{stats.upcomingSessions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="text-lg font-semibold text-emerald-600">{stats.completedSessions}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
