"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Server, Database, Cpu, HardDrive, MemoryStick, Shield, Loader2 } from "lucide-react";

export function AdminSystemPanel() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchSystemStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/system-stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch system stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Shield,
      description: "Registered system users",
    },
    {
      title: "Active Users",
      value: stats?.activeUsers || 0,
      icon: Server,
      description: "Currently active",
    },
    {
      title: "Total Jobs",
      value: stats?.totalJobs || 0,
      icon: Database,
      description: "All job orders",
    },
    {
      title: "Total Certificates",
      value: stats?.totalCertificates || 0,
      icon: HardDrive,
      description: "Issued certificates",
    },
    {
      title: "Total Inspections",
      value: stats?.totalInspections || 0,
      icon: Cpu,
      description: "Completed inspections",
    },
    {
      title: "Response Time",
      value: `${stats?.responseTime || 0}ms`,
      icon: MemoryStick,
      description: "Average API response",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">System Administration</h2>
        <p className="text-sm text-muted-foreground">
          System configuration, monitoring, and maintenance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{card.title}</span>
                <card.icon className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{card.value}</div>
                {card.title === "Response Time" && (
                  <Progress value={Math.min(stats?.responseTime || 0, 100)} className="h-2" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>System performance and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Database Status</span>
              <Badge variant="default">Connected</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Last Backup</span>
              <span className="text-muted-foreground">
                {stats?.lastBackup ? new Date(stats.lastBackup).toLocaleDateString() : "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Environment</span>
              <Badge variant="secondary">
                {stats?.environment || process.env.NODE_ENV || "Production"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>App Version</span>
              <Badge variant="outline">{stats?.version || "v2.1.0"}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminSystemPanel;