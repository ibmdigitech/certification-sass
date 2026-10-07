"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, GraduationCap, Calendar, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-2">
          Monitor training progress, active sessions, and compliance statuses.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trainees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,248</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">3 pending publishing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Next session in 2 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Competency Gaps</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>
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
                {/* Example rows */}
                <TableRow>
                  <TableCell className="font-medium">Ahmed Al Falasi</TableCell>
                  <TableCell>Lifting Equipment Safety</TableCell>
                  <TableCell><Badge variant="default" className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1"/> Passed</Badge></TableCell>
                  <TableCell className="text-right">Today</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">John Smith</TableCell>
                  <TableCell>Working at Heights</TableCell>
                  <TableCell><Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/10">In Progress</Badge></TableCell>
                  <TableCell className="text-right">Today</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Sarah Connor</TableCell>
                  <TableCell>Fire Safety Fundamentals</TableCell>
                  <TableCell><Badge variant="destructive" className="bg-red-500/15 text-red-500 hover:bg-red-500/25 border-red-500/20"><AlertCircle className="w-3 h-3 mr-1"/> Failed</Badge></TableCell>
                  <TableCell className="text-right">Yesterday</TableCell>
                </TableRow>
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
             {/* Loading State Example */}
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
