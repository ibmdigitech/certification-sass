"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, ShieldCheck, Award, FileText, Settings, Plus, BarChart3, Clock,
  CheckCircle, AlertCircle, Server, Database, Cpu
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AdminUsersPanel } from "./AdminUsersPanel";
import { AdminRolesPanel } from "./AdminRolesPanel";
import { AdminPermissionsPanel } from "./AdminPermissionsPanel";
import { AdminAuditLogsPanel } from "./AdminAuditLogsPanel";
import { AdminSystemPanel } from "./AdminSystemPanel";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  description?: string;
  trend?: "up" | "down";
}

function StatCard({ title, value, icon: Icon, description, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {description && (
              <p className={`text-xs text-muted-foreground ${trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : ""}`}>
                {description}
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        fetch("/api/admin/system-stats"),
        fetch("/api/admin/audit-logs?limit=5"),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (logsRes.ok) {
        const data = await logsRes.json();
        setRecentLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards: StatCardProps[] = stats
    ? [
        { title: "Total Users", value: stats.totalUsers || 0, icon: Users, description: "System users" },
        { title: "Active Users", value: stats.activeUsers || 0, icon: CheckCircle, description: "Currently active" },
        { title: "Total Jobs", value: stats.totalJobs || 0, icon: BarChart3, description: "All job orders" },
        { title: "Certificates", value: stats.totalCertificates || 0, icon: Award, description: "Issued certificates" },
        { title: "Inspections", value: stats.totalInspections || 0, icon: FileText, description: "Completed inspections" },
        { title: "Response Time", value: `${stats.responseTime || 0}ms`, icon: Cpu, description: "Avg API response" },
      ]
    : [];

  const quickActions = [
    { label: "Add User", icon: Plus, href: "/admin/users", tab: "users" },
    { label: "Add Role", icon: ShieldCheck, href: "/admin/roles", tab: "roles" },
    { label: "View Audit Logs", icon: FileText, href: "/admin/audit-logs", tab: "audit" },
    { label: "System Settings", icon: Settings, href: "/admin/system", tab: "system" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Administration Panel</h1>
        <p className="text-sm text-muted-foreground">
          System administration, user management, roles, and permissions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-4 w-4 mr-2" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" /> Users
          </TabsTrigger>
          <TabsTrigger value="roles">
            <ShieldCheck className="h-4 w-4 mr-2" /> Roles
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Award className="h-4 w-4 mr-2" /> Permissions
          </TabsTrigger>
          <TabsTrigger value="audit">
            <FileText className="h-4 w-4 mr-2" /> Audit Logs
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="h-4 w-4 mr-2" /> System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6 space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-family gap-4">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="h-6 w-3/4 bg-muted animate-pulse rounded mb-2"></div>
                      <div className="h-8 w-1/2 bg-muted animate-pulse rounded"></div>
                    </CardContent>
                  </Card>
                ))
              : statCards.map((card) => (
                  <StatCard
                    key={card.title}
                    title={card.title}
                    value={card.value}
                    icon={card.icon}
                    description={card.description}
                  />
                ))
            }
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => setActiveTab(action.tab)}
                  >
                    <action.icon className="h-5 w-5" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest audit log entries</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading recent activity...
                </div>
              ) : recentLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent activity
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(log.timestamp || log.createdAt || Date.now()), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{log.action}</Badge>
                        </TableCell>
                        <TableCell>
                          {log.user?.name || log.user?.email || "System"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.details || log.message || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <AdminUsersPanel />
        </TabsContent>

        <TabsContent value="roles" className="mt-6">
          <AdminRolesPanel />
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <AdminPermissionsPanel />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <AdminAuditLogsPanel />
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <AdminSystemPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminDashboard;